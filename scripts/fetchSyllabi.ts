/* eslint-disable no-await-in-loop, no-console */
import axios from 'axios';
import {
  createWriteStream, existsSync, mkdirSync, readFileSync, writeFileSync,
} from 'fs';
import path from 'path';
import { getFilePath } from './util';

const BASE_URL = 'https://syllabus-api.tlt.harvard.edu/search';
const COURSE_URL = 'https://syllabus-api.tlt.harvard.edu/course';
const DOWNLOAD_URL = 'https://syllabus-api.tlt.harvard.edu/download/';
const PAGE_SIZE = 50;

interface InstanceResponse {
  instance_id: string;
  score: number;
}

interface FullInstance {
  all_instructor_names: string;
  description: string;
  instance_id: string;
  my_h_id: string;
  s3_filekey: string | null;
  term_name: string;
}

interface CourseResponse<InstanceType> {
  course_code: string;
  course_title: string;
  dept_name: string;
  doc_id: string;
  instances: InstanceType[];
  program_name: string;
  school_name: string;
}

interface SearchHit extends CourseResponse<InstanceResponse> {
  score: number;
}

interface FileRequestPayload {
  courseCode: string;
  courseId: string;
  s3KeyPrefix: string;
  termName: string;
}

interface SearchResponse {
  hits: SearchHit[];
  total: number;
}

function getAuthToken() {
  // eslint-disable-next-line prefer-destructuring
  const SYLLABI_AUTH = process.env.SYLLABI_AUTH;
  if (!SYLLABI_AUTH) {
    throw new Error('must set SYLLABI_AUTH env variable');
  }
  return SYLLABI_AUTH;
}

// Fetch all courses under the college
async function fetchAllCourses(): Promise<SearchHit[]> {
  const courses = [];
  let count = 0;
  // loop until we have all the courses
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const { data } = await axios.post<SearchResponse>(BASE_URL, {
      filters: {
        dept_ids: [],
        school_ids: [
          'colgsas',
        ],
        when: 'anytime',
      },
      size: PAGE_SIZE,
      from: count,
      query: '*',
    }, {
      headers: {
        Authorization: getAuthToken(),
      },
    });
    const { hits, total } = data;
    courses.push(...hits);
    count += hits.length;
    console.log(`done ${count}/${total}`);
    if (count >= total) break;
  }

  return courses;
}

// Get extended information about the given course
async function fetchCourseData(course: SearchHit) {
  const { data } = await axios.get<CourseResponse<FullInstance>>(COURSE_URL, {
    params: { doc_id: course.doc_id },
    headers: {
      Authorization: getAuthToken(),
    },
  });

  return data;
}

// Get extended information about all courses
function fetchAllCourseData(courses: SearchHit[]) {
  const promises = courses.map((hit, i) => new Promise<CourseResponse<FullInstance>>((resolve) => {
    setTimeout(() => fetchCourseData(hit).then((course) => resolve(course)), 100 * i);
  }));
  return Promise.all(promises);
}

async function getSyllabusUrl(payload: FileRequestPayload) {
  const { data } = await axios.post<{ url: string }>(DOWNLOAD_URL, payload, {
    headers: { Authorization: getAuthToken() },
  });
  return data.url;
}

// For the given course, for each instance of that course, download the syllabi of that instance
function downloadFiles(course: CourseResponse<FullInstance>, dirPath: string) {
  // get all instances with a file
  const instances = course.instances.filter((instance) => instance.s3_filekey);

  console.log(
    `downloading ${instances.length} files for course ${course.course_code}`,
  );

  const promises = instances.map(async ({
    instance_id, s3_filekey, my_h_id, term_name,
  }, i) => {
    await new Promise((resolve) => { setTimeout(resolve, 100 * i); });

    const url = await getSyllabusUrl({
      courseCode: course.course_code,
      courseId: my_h_id,
      s3KeyPrefix: s3_filekey!,
      termName: term_name,
    });

    const response = await axios.get(url, { responseType: 'stream' });

    const ext = s3_filekey!.slice(s3_filekey!.lastIndexOf('.'));
    const stream = createWriteStream(path.join(dirPath, instance_id + ext));
    response.data.pipe(stream);
    await new Promise((resolve, reject) => {
      stream.on('finish', resolve);
      stream.on('error', reject);
    });
  });
  return Promise.all(promises);
}

export default {
  label: 'Fetch syllabi from Harvard Syllabus Explorer',
  async run() {
    getAuthToken();
    const baseDir = await getFilePath(
      'File path to save syllabi in:',
      'data/syllabi',
    );

    if (!existsSync(baseDir)) mkdirSync(baseDir, { recursive: true });

    const coursesPath = path.join(baseDir, 'all-courses.json');
    let courses: SearchHit[];
    if (existsSync(coursesPath)) {
      console.log('using', coursesPath);
      const json = readFileSync(coursesPath).toString();
      courses = JSON.parse(json);
    } else {
      console.log('fetching courses');
      courses = await fetchAllCourses();
      writeFileSync(coursesPath, JSON.stringify(courses));
    }

    const extendedPath = path.join(baseDir, 'all-courses-extended.json');
    let extended: CourseResponse<FullInstance>[];
    if (existsSync(extendedPath)) {
      console.log('using', extendedPath);
      const json = readFileSync(extendedPath).toString();
      extended = JSON.parse(json);
    } else {
      console.log('loading extended course data');
      extended = await fetchAllCourseData(courses);
      writeFileSync(extendedPath, JSON.stringify(extended));
    }

    const syllabiDir = path.join(baseDir, 'syllabi');
    if (!existsSync(syllabiDir)) mkdirSync(syllabiDir);

    console.log('downloading syllabi');
    const promises = extended.map(async (course) => {
      await downloadFiles(course, syllabiDir);
    });
    await Promise.all(promises);
  },
};
