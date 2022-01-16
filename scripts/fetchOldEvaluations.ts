/* eslint-disable no-console, no-await-in-loop */
import axios from 'axios';
import cheerio, { CheerioAPI } from 'cheerio';
import fs from 'fs';
import {
  CourseGeneralQuestions,
  Evaluation,
  GeneralInstructorQuestions,
  HoursStats,
  ReasonsForEnrolling,
} from '../shared/apiTypes';
import { Season } from '../shared/firestoreTypes';
import { allTruthy } from '../shared/util';

const baseUrl = 'https://course-evaluation-reports.fas.harvard.edu/fas';
const years: string[] = [];

for (let i = 2006; i <= 2018; i += 1) {
  years.push(`${i}_1`, `${i}_2`);
}

type Row = {
  elements: string[];
  img: string | undefined;
};

type Distribution = [number, number, number, number, number];

export type TermString = `${number}_${1 | 2}`;

// ==================== utility functions for statistics ====================

/**
 * @param img a string of the form "../histobar-a-b-c-d-e.png", where a..e are the number of students who voted
 * 1..5 respectively
 * @returns an array containing [e,d,c,b,a], that is, in the order corresponding to categories 5..1 as it is shown on Q Reports
 */
function getDistributionFromImage(img: string) {
  const vals = img
    .slice(12, -4)
    .split('-')
    .map((val) => parseInt(val, 10) || 0)
    .reverse();
  if (vals.length !== 5) throw new Error('invalid image to parse');
  return vals as Distribution;
}

const NO_STATISTICS = {
  count: 0,
  courseMean: null,
  votes: null,
  fasMean: null,
} as const;

// <3, 3-6, 7-10, 11-14, >14
// but gets reversed since distribution goes from highest to lowest
const OLD_WORKLOAD_DISTRIBUTION = [16.5, 12.5, 8.5, 4.5, 0.5] as const;

function loadRow(row: Row, useOldWorkload = false) {
  if (!row.img) {
    return NO_STATISTICS;
  }

  const votes = getDistributionFromImage(row.img);
  const total = votes.reduce((acc, val) => acc + val, 0);
  // opposite direction from Q Guides, goes from 1 to 5
  const mean = total > 0
    ? votes.reduce(
      (acc, val, i) => acc + val * (useOldWorkload ? OLD_WORKLOAD_DISTRIBUTION[i] : 5 - i),
      0,
    ) / total
    : null;
  return {
    count: total,
    courseMean: mean,
    votes,
    fasMean: null,
  } as const;
}

function getMedian(freqs: Distribution, useOldWorkload = false) {
  const count = freqs.reduce((acc, val) => acc + val, 0);
  let acc = 0;
  for (let i = 0; i < freqs.length; i += 1) {
    acc += freqs[i];
    if (acc > count / 2) {
      return useOldWorkload ? OLD_WORKLOAD_DISTRIBUTION[i] : 5 - i;
    }
    if (acc === count / 2) {
      for (let j = i + 1; j < freqs.length; j += 1) {
        if (freqs[j] !== 0) {
          return (
            (useOldWorkload
              ? OLD_WORKLOAD_DISTRIBUTION[i] + OLD_WORKLOAD_DISTRIBUTION[j]
              : 5 - i + 5 - j)
              / 2
          );
        }
      }
    }
  }
  throw new Error(`Error calculating the median of ${freqs}`); // something wrong happened
}

/**
 * @param freqs see {@link getDistributionFromImage}
 * @returns the standard deviation of freqs
 */
function getStdev(freqs: Distribution, useOldWorkload = false) {
  const count = freqs.reduce((acc, freq) => acc + freq, 0);
  const mean = freqs.reduce(
    (acc, freq, i) => acc + freq * (useOldWorkload ? OLD_WORKLOAD_DISTRIBUTION[i] : 5 - i),
    0,
  ) / count;
  let total = 0;
  for (let i = 0; i < freqs.length; i += 1) {
    total
      += freqs[i]
      * ((useOldWorkload ? OLD_WORKLOAD_DISTRIBUTION[i] : 5 - i) - mean) ** 2;
  }
  return total / count;
}

function getReasons(reasons: Row[]): ReasonsForEnrolling {
  const ret: ReasonsForEnrolling = {
    concentration: 0,
    distribution: 0,
    elective: 0,
    expos: 0,
    gened: 0,
    language: 0,
    premed: 0,
    qrd: 0,
    secondary: 0,
  };

  reasons.slice(1).forEach(({ elements, img }) => {
    const title = elements[0].replace(/\s+/g, ' ').trim();
    if (!img || !title) return;
    const count = parseInt(img!.split('-')[1], 10);
    switch (title) {
      case 'Elective':
        ret.elective += count;
        break;
      case 'Concentration or Department Requirement':
      case 'Concentration/Program Requirement':
        ret.concentration += count;
        break;
      case 'Secondary Field or Language Citation Requirement':
        ret.secondary += count;
        break;
      case 'Undergraduate Core or General Education Requirement':
      case 'Undergraduate Core Requirement':
        ret.gened += count;
        break;
      case 'Expository Writing Requirement':
        ret.expos += count;
        break;
      case 'Foreign Language Requirement':
      case 'Contributed to Speaking Language':
      case 'Contributed to Listening Comprehension':
      case 'Contributed to Reading Language':
      case 'Contributed to Writing Language':
      case 'Contributed to Understanding Culture':
        ret.language += count;
        break;
      case 'Pre-Med Requirement':
        ret.premed += count;
        break;
      default:
        console.error(`unknown reason: ${title}`);
        break;
    }
  });
  return ret;
}

function getGraphs($: CheerioAPI) {
  return $('.graphReport')
    .toArray()
    .map((table) => $('tbody tr', table)
      .toArray()
      .map((tr) => ({
        elements: $(tr)
          .children()
          .toArray()
          .map((td) => $(td).text().replace(/\s+/g, ' ')),
        img: $('img', $(tr).children()[1]).attr('src'),
      })));
}

async function getInstructor(url: string): Promise<{
  instructorName: string;
  data?: GeneralInstructorQuestions;
}> {
  const result = await axios.get(url);
  const $ = cheerio.load(result.data);
  const [lastName, firstName] = $(
    'select[name="current_instructor_or_tf_huid_param"] > option[selected]',
  )
    .text()
    .trim()
    .split(', ');
  const instructorName = `${firstName} ${lastName}`;
  const [graph] = getGraphs($);
  if (!graph) return { instructorName };
  const data = {} as GeneralInstructorQuestions;
  graph.slice(1).forEach((row) => {
    const title = row.elements[0].replace(/\s+/g, ' ').trim();
    if (!title) return;
    switch (title) {
      case 'Person Overall':
      case 'Instructor Overall':
        data['Evaluate your Instructor overall.'] = loadRow(row);
        break;
      case 'Effective Lectures or Presentations':
        data['Gives effective lectures or presentations, if applicable'] = loadRow(row);
        break;
      case 'Accessible Outside Class':
        data[
          'Is accessible outside of class (including after class, office hours, e-mail, etc.)'
        ] = loadRow(row);
        break;
      case 'Generates Enthusiasm':
        data['Generates enthusiasm for the subject matter'] = loadRow(row);
        break;
      case 'Facilitates Discussion & Encourages Participation':
        data['Facilitates discussion and encourages participation'] = loadRow(row);
        break;
      case 'Gives Useful Feedback':
        data['Gives useful feedback on assignments'] = loadRow(row);
        break;
      case 'Returns Assignments in Timely Fashion':
        data['Returns assignments in a timely fashion'] = loadRow(row);
        break;
      default:
        console.error(`unknown instructor field: ${title}`);
    }
  });

  return {
    instructorName,
    data,
  };
}

async function getComments(placeholderUrl: string): Promise<string[] | null> {
  const placeholderResult = await axios.get(placeholderUrl);
  const newUrl = cheerio
    .load(placeholderResult.data)('.reportContent a')
    .attr('href');
  if (!newUrl) return null;
  const commentsPage = await axios.get(`${baseUrl}/${newUrl}`);
  const $ = cheerio.load(commentsPage.data);
  const comments = $('.responseBlock p')
    .toArray()
    .map((p) => $(p).text().replace(/\s+/g, ' ').trim());
  return comments;
}

function getWorkload(
  row: Row,
  invited: number,
): HoursStats {
  const { votes, count, courseMean } = loadRow(row, true);

  if (!votes) {
    return {
      count: 0,
      mean: null,
      median: null,
      mode: null,
      stdev: null,
      ratio: 0,
    };
  }

  return {
    count,
    mean: courseMean,
    median: getMedian(votes, true),
    ratio: count / invited,
    mode:
      votes.reduce(
        (acc, val, i) => (val > acc.max ? { index: i, max: val } : acc),
        {
          index: -1,
          max: -1,
        },
      ).index + 1,
    stdev: getStdev(votes, true),
  };
}

async function parseEvaluation(url: string, year: number, season: Season) {
  const result = await axios.get(url);
  const $ = cheerio.load(result.data);

  const title = $('#page-content > h1').text();
  const courseName = title.slice(0, title.indexOf(':'));
  const [, enrolment, , evaluations] = $('#summaryStats')
    .text()
    .trim()
    .split(/\s+/g);
  const invited = parseInt(enrolment, 10);
  const [general, workload, recommend, reasons]: Row[][] = getGraphs($);

  if (!general) throw new Error('did not find any graphs');

  const generalData = {} as CourseGeneralQuestions;
  general.slice(1).forEach((row) => {
    const rowTitle = row.elements[0].replace(/\s+/g, ' ').trim();
    if (!rowTitle) return;
    switch (rowTitle) {
      case 'Course Overall':
        generalData['Evaluate the course overall.'] = loadRow(row);
        break;
      case 'Materials':
        generalData[
          'Course materials (readings, audio-visual materials, textbooks, lab manuals, website, etc.)'
        ] = loadRow(row);
        break;
      case 'Assignments':
        generalData[
          'Assignments (exams, essays, problem sets, language homework, etc.)'
        ] = loadRow(row);
        break;
      case 'Feedback':
        generalData[
          'Feedback you received on work you produced in this course'
        ] = loadRow(row);
        break;
      case 'Section':
        generalData['Section component of the course'] = loadRow(row);
        break;
      case 'Pointed to Dissertation Topic or Research Lab':
        generalData['Pointed to Dissertation Topic or Research Lab'] = loadRow(row);
        break;
      case 'Helped Develop Research Skills':
        generalData['Helped Develop Research Skills'] = loadRow(row);
        break;
      case 'Could be Developed into Talks or Publications':
        generalData['Could be Developed into Talks or Publications'] = loadRow(row);
        break;
      case 'Helped Prepare for Generals':
        generalData['Helped Prepare for Generals'] = loadRow(row);
        break;
      default:
        console.error(`unknown attribute when parsing course: ${rowTitle}`);
    }
  });
  // const [, overall, materials, assignments, feedback, section] = general;

  const recommendRow = loadRow(recommend[1]);
  const recommendations = recommendRow.votes;

  const instructorUrl = $('#tabNav > li:nth-child(2) > a').attr('href');
  const { instructorName, data: instructorFeedback } = await getInstructor(
    `${baseUrl}/${instructorUrl!}`,
  );

  const commentsUrl = $('#tabNav > li:nth-child(3) > a').attr('href');
  const comments = await getComments(`${baseUrl}/${commentsUrl}`);

  const ret: Evaluation = {
    url,
    courseName,
    instructorName,
    season,
    year,
    comments,
    'Course General Questions': generalData,
    'Course Response Rate': {
      invited,
      responded: parseInt(evaluations, 10),
    },
    'General Instructor Questions': instructorFeedback,
    'How strongly would you recommend this course to your peers?': {
      count: recommendRow.count,
      mean: recommendRow.courseMean,
      median: recommendations ? getMedian(recommendations) : null,
      ratio: recommendRow.count / invited,
      stdev: recommendations ? getStdev(recommendations) : null,
      recommendations,
    },
    'On average, how many hours per week did you spend on coursework outside of class? Enter a whole number between 0 and 168.':
      getWorkload(workload[1], invited),
    'What was/were your reason(s) for enrolling in this course? (Please check all that apply)':
      getReasons(reasons),
  };

  return ret;
}

async function getEvaluationLinks(dept: string, year: string, term: string) {
  const response = await axios.get(`${baseUrl}/guide_dept`, {
    params: { dept: decodeURIComponent(dept), year, term },
  });
  const $ = cheerio.load(response.data);
  return $('a')
    .map((_, a) => $(a).attr('href'))
    .toArray();
}

function loadEvaluations(urls: string[], year: number, term: Season) {
  return Promise.allSettled(
    urls.map(
      (url, i) => new Promise<Evaluation | null>((resolve, reject) => {
        setTimeout(() => {
          console.error(
            `parsing evaluation ${i + 1}/${urls.length} ${baseUrl}/${url}`,
          );
          parseEvaluation(`${baseUrl}/${url}`, year, term)
            .then((result) => resolve(result))
            .catch((err) => {
              console.error(`error loading ${url}:`);
              console.error(err.message);
              // eslint-disable-next-line prefer-promise-reject-errors
              reject({ url });
            });
        }, i * 750);
      }),
    ),
  );
}

/**
 * Main function to parse all evaluations from https://course-evaluation-reports.fas.harvard.edu/fas/list
 */
export default async function fetchOldEvaluations(
  startTerm: TermString,
  endTerm: TermString,
  baseDir: string,
) {
  const cookie = process.env.EVALUATIONS_COOKIE;

  if (!cookie) throw new Error('must provide EVALUATIONS_COOKIE env variable');

  axios.defaults.headers.common.Cookie = cookie;

  if (!fs.existsSync(baseDir)) fs.mkdirSync(baseDir);

  const startIndex = years.indexOf(startTerm);
  let endIndex: number | undefined = years.indexOf(endTerm);
  endIndex = endIndex >= 0 ? endIndex : undefined;
  console.log(startIndex, endIndex);
  // eslint-disable-next-line no-restricted-syntax
  for (const yearterm of years.slice(startIndex, endIndex)) {
    const response = await axios({
      method: 'GET',
      url: 'https://course-evaluation-reports.fas.harvard.edu/fas/list',
      params: {
        yearterm,
      },
    });
    console.error(
      `==================== LOADING YEAR ${yearterm} ====================`,
    );

    const $ = cheerio.load(response.data);
    const departments = $('.course-block-head > .remove_link > span')
      .map((_, span) => $(span).attr('title_abbrev'))
      .toArray();
    const [schoolYear, termNumber] = yearterm.split('_');

    if (!fs.existsSync(`${baseDir}/${yearterm}`)) {
      fs.mkdirSync(`${baseDir}/${yearterm}`);
    }

    // eslint-disable-next-line no-restricted-syntax
    for (const department of departments) {
      console.error(
        `==================== loading department ${department} ====================`,
      );
      const urls = await getEvaluationLinks(department, schoolYear, termNumber);
      const [year, term]: [number, Season] = parseInt(termNumber, 10) === 1
        ? [parseInt(schoolYear, 10), 'Fall']
        : [parseInt(schoolYear, 10) + 1, 'Spring'];
      const results = await loadEvaluations(urls, year, term);
      const successes = allTruthy(
        results.map((result) => (result.status === 'fulfilled' ? result.value : null)),
      );
      console.error(
        `===== loaded ${successes.length}/${urls.length} evaluations for department ${department} =====`,
      );

      // retry failed requests once
      const failures = allTruthy(
        results.map((result) => (result.status === 'rejected' ? result.reason : null)),
      );
      if (failures.length > 0) {
        console.error(`===== retrying ${failures.length} evaluations =====`);
        const retryResults = await loadEvaluations(
          failures.map((reason: { url: string }) => reason.url),
          year,
          term,
        );
        const retrySuccesses = allTruthy(
          retryResults.map((result) => (result.status === 'fulfilled' ? result.value : null)),
        );
        console.error(`${retrySuccesses.length} successes on retry`);
        successes.push(...retrySuccesses);
      }

      fs.writeFileSync(
        `${baseDir}/${yearterm}/${decodeURIComponent(department)}.json`,
        JSON.stringify(successes),
      );
    }
  }
}
