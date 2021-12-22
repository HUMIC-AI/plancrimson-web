/* eslint-disable @typescript-eslint/no-use-before-define */
import cheerio, { BasicAcceptedElems, CheerioAPI, Node } from 'cheerio';
import { Class, EvaluationResponse, ExtendedClass } from '../src/types';
import fetcher, { FetchError } from '../shared/fetcher';

type Scraper = ($: CheerioAPI, el: BasicAcceptedElems<Node>) => any;

const QReportMsg = 'Must provide authentication to access Q Reports. Visit https://qreports.fas.harvard.edu/browse/index, check the network request to "index", and copy the Cookie header into the Q_REPORTS_COOKIE variable in .env.local.';

function assertQReportsCookie() {
  const cookie = process.env.Q_REPORTS_COOKIE;
  if (!cookie) {
    throw new Error(QReportMsg);
  }
  return cookie;
}

function assertExploranceCookie() {
  const cookie = process.env.EXPLORANCE_COOKIE;
  if (!cookie) {
    throw new Error('Must provide authentication to access QReports. Visit any Q Report page, e.g. https://harvard.bluera.com/harvard/rpvf-eng.aspx?lang=eng&redi=1&SelectedIDforPrint=2df896f38db7a3b95e9d749eecad2e77c1a9b3f2adfee3771214d92e63fcf7aea9cc1c51a29ba537e44683b279e4e65b&ReportType=2&regl=en-US, check the network request to "the main page", and copy the Cookie header into the EXPLORANCE_COOKIE variable in .env.local.');
  }
  return cookie;
}

export async function extendClass(cls: Class, withEvals = true) {
  const ret = { ...cls, textDescription: getDescriptionText(cls) } as ExtendedClass;
  if (withEvals) {
    try {
      const evals = await getAllEvaluations(cls.ACAD_CAREER, cls.SUBJECT + cls.CATALOG_NBR);
      ret.evals = evals;
    } catch (err) {
      const { message } = err as Error;
      throw new Error(`error fetching evaluations for class ${cls}: ${message}`);
    }
  }
  return ret;
}

export function getDescriptionText(course: Class) {
  try {
    const $ = cheerio.load(course.IS_SCL_DESCR);
    return $.text();
  } catch (err) {
    return course.IS_SCL_DESCR;
  }
}

export default async function getAllEvaluations(school: string, course: string) {
  let response;

  try {
    response = await fetcher({
      method: 'GET',
      url: 'https://qreports.fas.harvard.edu/home/courses',
      params: {
        school,
        search: course,
      },
      headers: {
        Origin: 'https://portal.my.harvard.edu',
        Cookie: assertQReportsCookie(),
      },
    });
  } catch (err) {
    const { message, info } = err as FetchError;
    throw new Error(`error getting evaluations from ${school} ${course}: ${message} ${info}`);
  }

  let $: CheerioAPI;
  try {
    $ = cheerio.load(response);
  } catch (err: any) {
    throw new Error(`error parsing result from ${school} ${course}: ${err.message}`);
  }

  if ($('title').text() === 'HarvardKey - Harvard University Authentication Service') {
    throw new Error(QReportMsg);
  }

  const promises = $('#dtCourses > tbody > tr a')
    .map((_, a) => {
      const url = $(a).attr('href');
      if (!url) return null;
      try {
        return getEvaluation(url);
      } catch (err: any) {
        return null;
      }
    })
    .toArray();

  const results = await Promise.allSettled(promises);

  return results
    .map((result) => (result.status === 'fulfilled' ? result.value : null))
    .filter((el) => el !== null) as EvaluationResponse[];
}

async function getEvaluation(url: string): Promise<EvaluationResponse> {
  let response = null;
  try {
    response = await fetcher({
      method: 'GET',
      url,
      headers: {
        Cookie: assertExploranceCookie(),
      },
    });
  } catch (err) {
    const { message } = err as FetchError;
    if (message === 'Maximum number of redirects exceeded') {
      throw new Error('Maximum number of redirects exceeded. Check the explorance cookie.');
    }
    throw new Error(`Error fetching from ${url}: ${message}`);
  }

  try {
    const $ = cheerio.load(response);
    const toc = $('.TOC h2').text().trim().split(' ');
    const initial = {
      url,
      term: parseInt(toc[4], 10),
      season: toc[5],
    } as EvaluationResponse;

    return $('.report-block').toArray().reduce((acc, el) => {
      const title = $(el).find('h3, h4').text().trim() as keyof EvaluationResponse;

      let data = null;
      if (title === 'Course Response Rate') {
        data = getResponseRate($, el);
      } else if (title === 'Course General Questions') {
        data = getGeneralQuestions($, el);
      } else if (title === 'General Instructor Questions') {
        data = getGeneralQuestions($, el);
      } else if (
        title
    === 'On average, how many hours per week did you spend on coursework outside of class? Enter a whole number between 0 and 168.'
      ) {
        data = getHours($, el);
      } else if (title === 'How strongly would you recommend this course to your peers?') {
        data = getRecommendations($, el);
      } else if (title === 'What was/were your reason(s) for enrolling in this course? (Please check all that apply)') {
        data = getReasons($, el);
      }

      // skip if parsing fails for some reason
      if (data === null) return acc;

      // otherwise send the results back keyed by the question title
      return {
        ...acc,
        [title]: data,
      };
    }, initial);
  } catch (err) {
    const { message } = err as Error;
    throw new Error(`couldn't parse html from ${url}: ${message}`);
  }
}

const getResponseRate: Scraper = ($, el) => {
  const nums = $(el)
    .find('tbody td')
    .toArray()
    .map((td) => parseInt($(td).text().trim(), 10));
  if (nums.length !== 3) {
    throw new Error('Could not read course participation');
  }
  const [responded, invited] = nums;
  return { responded, invited };
};

// gets the votes in descending order, i.e. excellent, then very good, etc., down to unsatisfactory
// same way it shows up in the q guide
const getGeneralQuestions: Scraper = ($, el) => $(el)
  .find('tbody tr')
  .toArray()
  .reduce((acc, tr) => {
    const row = $(tr)
      .children()
      .toArray()
      .map((child) => $(child).text().trim());
    if (row.length !== 9) {
      throw new Error('Could not read course feedback');
    }

    const title = row[0];
    const count = parseInt(row[1], 10);
    const votes = row.slice(2, 7).map((v) => parseInt(v, 10));
    const courseMean = parseFloat(row[7]);
    const fasMean = parseFloat(row[8]);
    return {
      ...acc,
      [title]: {
        count,
        votes,
        courseMean,
        fasMean,
      },
    };
  }, {});

const getRecommendations: Scraper = ($, el) => {
  const tables = $(el).find('tbody');
  if (tables.length !== 2) throw new Error('Could not read recommendations');

  const recommendations = tables
    .first()
    .children() // trs
    .toArray()
    .map((tr) => {
      const row = $(tr)
        .children() // td
        .toArray()
        .map((td) => $(td).text().trim());
      if (row.length !== 4) {
        throw new Error('Could not read recommendations');
      }
      return parseInt(row[2], 10);
    })
    .reverse();
  const total = recommendations.reduce((acc, val) => acc + val, 0);

  const stats = tables
    .last()
    .find('td')
    .toArray()
    .map((td) => parseFloat($(td).text().trim().replace('%', '')));
  if (stats.length !== 4) {
    throw new Error('Could not read recommendation statistics');
  }
  const [ratio, mean, median, stdev] = stats;
  return {
    recommendations,
    total,
    ratio,
    mean,
    median,
    stdev,
  };
};

const getHours: Scraper = ($, el) => {
  const nums = $(el)
    .find('tbody td')
    .map((_, td) => parseFloat($(td).text().trim().replace('%', '')))
    .toArray();
  if (nums.length !== 6) {
    throw new Error('Could not read course hours');
  }
  const [count, ratio, mean, median, mode, stdev] = nums;
  return {
    count, ratio, mean, median, mode, stdev,
  };
};

const getReasons: Scraper = ($, el) => {
  const nums = $(el)
    .find('tbody td')
    .map((_, td) => parseInt($(td).text().trim(), 10))
    .toArray();

  if (nums.length !== 9) {
    throw new Error('Could not read reasons for enrolling');
  }
  const [
    elective,
    concentration,
    secondary,
    gened,
    expos,
    language,
    premed,
    distribution,
    qrd,
  ] = nums;
  return {
    elective, concentration, secondary, gened, expos, language, premed, distribution, qrd,
  };
};
