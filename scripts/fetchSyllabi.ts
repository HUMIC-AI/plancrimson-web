/* eslint-disable no-await-in-loop, no-console */
import axios from 'axios';
import {
  createWriteStream, existsSync, mkdirSync, writeFileSync,
} from 'fs';
import subjects from '../src/subjects.json';

const BASE_URL = 'https://syllabus-api.tlt.harvard.edu/search';
const COURSE_URL = 'https://syllabus-api.tlt.harvard.edu/course';
const DOWNLOAD_URL = 'https://syllabus-api.tlt.harvard.edu/download/';
const PAGE_SIZE = 10;

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
  const { SYLLABI_AUTH } = process.env;
  if (!SYLLABI_AUTH) {
    throw new Error('must set SYLLABUS_AUTH env variable');
  }
  return SYLLABI_AUTH;
}

async function getSyllabusUrl(payload: FileRequestPayload) {
  const { data } = await axios.post<{ url: string }>(DOWNLOAD_URL, payload, {
    headers: { Authorization: getAuthToken() },
  });
  return data.url;
}

async function fetchCourseData(course: SearchHit) {
  const { data } = await axios.get<CourseResponse<FullInstance>>(COURSE_URL, {
    params: {
      doc_id: course.doc_id,
    },
    headers: {
      Authorization: getAuthToken(),
    },
  });

  return data;
}

export async function getCoursesBySubject(subject: string, pageIndex: number) {
  const { data } = await axios.post<SearchResponse>(
    BASE_URL,
    {
      filters: {
        dept_ids: [],
        school_ids: ['colgsas'],
        when: 'anytime',
      },
      from: pageIndex * PAGE_SIZE,
      size: PAGE_SIZE,
      query: subject,
    },
    {
      headers: {
        Authorization: getAuthToken(),
      },
    },
  );

  return {
    hits: data.hits.filter((course) => course.course_code.startsWith(subject)),
    total: data.total,
  };
}

function downloadFiles(course: CourseResponse<FullInstance>, dirPath: string) {
  if (!existsSync(dirPath)) mkdirSync(dirPath, { recursive: true });

  const instances = course.instances.filter((instance) => instance.s3_filekey);

  console.log(
    `downloading ${instances.length} files for course ${course.course_code}`,
  );

  return Promise.all(
    instances.map(async ({
      instance_id, s3_filekey, my_h_id, term_name,
    }) => {
      const url = await getSyllabusUrl({
        courseCode: course.course_code,
        courseId: my_h_id,
        s3KeyPrefix: s3_filekey!,
        termName: term_name,
      });
      const response = await axios.get(url, {
        responseType: 'stream',
      });
      const stream = createWriteStream(
        `${dirPath}/${instance_id}${s3_filekey!.slice(
          s3_filekey!.lastIndexOf('.'),
        )}`,
      );
      response.data.pipe(stream);
      await new Promise((resolve, reject) => {
        stream.on('finish', resolve);
        stream.on('error', reject);
      });
    }),
  );
}

export default async function fetchSyllabi(
  dirPath: string,
  startIndex: number,
  endIndex: number | undefined,
) {
  getAuthToken(); // assert environment variable set

  for (const subject of Object.keys(subjects).sort().slice(startIndex, endIndex)) {
    let pageIndex = 0;
    const hits: SearchHit[] = [];

    // eslint-disable-next-line no-constant-condition
    while (true) {
      const { hits: courses, total } = await getCoursesBySubject(
        subject,
        pageIndex,
      );
      hits.push(...courses);
      pageIndex += 1;
      // if the next request would start past the total
      if (pageIndex * PAGE_SIZE >= total) {
        break;
      }
    }

    const results = await Promise.all(
      hits.map(async (hit) => {
        const course = await fetchCourseData(hit);
        await downloadFiles(course, `${dirPath}/${subject}`);
        return course;
      }),
    );

    writeFileSync(`${dirPath}/${subject}.json`, JSON.stringify(results));
    console.log(`done subject ${subject} with ${results.length} courses`);
  }
}
