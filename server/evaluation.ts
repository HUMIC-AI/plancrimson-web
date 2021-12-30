/* eslint-disable @typescript-eslint/no-use-before-define */
import cheerio, { BasicAcceptedElems, CheerioAPI, Node } from 'cheerio';
import { getFirestore } from 'firebase-admin/firestore';
import { Class, ExtendedClass, Evaluation } from '../shared/apiTypes';
import fetcher, { FetchError } from '../shared/fetcher';

type Scraper = ($: CheerioAPI, el: BasicAcceptedElems<Node>) => any;

export async function getEvaluations(courseName: string): Promise<Evaluation[]> {
  const db = getFirestore();
  const evaluations = await db.collection('evaluations').where('courseName', '==', courseName).get();
  return evaluations.docs.map((doc) => doc.data() as Evaluation);
}

type Mean = {
  count: number;
  mean: number;
};

function calcMean(arr: Mean[]) {
  const weightedTotal = arr.reduce((acc, val) => acc + val.mean * val.count, 0);
  const count = arr.reduce((acc, val) => acc + val.count, 0);
  return weightedTotal / count;
}

/**
 * @param cls the class to get evaluations for
 * @param withEvals whether to include evaluations. If this is set to true and the evaluations can't
 * be fetched, will throw a FetchError containing the error message and the data
 * @returns the class object with the added textDescirption and evals properties
 */
export async function extendClass(cls: Class, withEvals = true) {
  const ret: ExtendedClass = {
    ...cls,
    textDescription: getDescriptionText(cls),
  };
  if (withEvals) {
    try {
      const evals = await getEvaluations(cls.SUBJECT + cls.CATALOG_NBR);
      if (evals.length === 0) return ret;
      const classSizes = evals.map((evl) => evl['Course Response Rate'].invited);
      ret.meanClassSize = classSizes.reduce((acc, val) => acc + val, 0) / classSizes.length;
      const ratings = evals.map((evl) => {
        const data = evl['Course General Questions']['Evaluate the course overall.'];
        if (!data.courseMean) return null;
        return { mean: data.courseMean, count: data.count };
      }).filter((val) => val !== null) as Mean[];
      ret.meanRating = calcMean(ratings);
      const recommendations = evals.map((evl) => evl['How strongly would you recommend this course to your peers?']);
      ret.meanRecommendation = calcMean(recommendations);
      const hours = evals.map((evl) => evl['On average, how many hours per week did you spend on coursework outside of class? Enter a whole number between 0 and 168.']);
      ret.meanHours = calcMean(hours);
    } catch (err) {
      const { message } = err as Error;
      throw new FetchError(
        `error fetching evaluations for class ${cls.SUBJECT + cls.CATALOG_NBR}`,
        0,
        {
          error: message,
          data: ret,
        },
      );
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

export async function getEvaluation(url: string, {
  auth,
}: { auth: string }): Promise<Evaluation> {
  let response = null;
  try {
    response = await fetcher({
      method: 'GET',
      url,
      headers: {
        Cookie: auth,
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
    const text = $('.ChildReportSkipNav a').text();
    const [courseName, instructorName] = text.slice('Feedback for '.length, text.indexOf('(')).split('-').map((str) => str.trim());
    const toc = $('.TOC h2').text().trim().split(' ');
    const initial = {
      url,
      year: parseInt(toc[4], 10),
      season: toc[5],
      courseName,
      instructorName,
    } as Evaluation;

    return $('.report-block').toArray().reduce((acc, el) => {
      const title = $(el).find('h3, h4').text().trim() as keyof Evaluation;

      // const COURSE_FEEDBACK_FOR = 'Course Feedback for ';
      // const INSTRUCTOR_FEEDBACK_FOR = 'Instructor Feedback for ';
      let data = null;
      const key = title;

      try {
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
      } catch (err) {
        console.error(err);
        return acc;
      }
      // else if (title.startsWith(COURSE_FEEDBACK_FOR)) {
      //   data = title.slice(COURSE_FEEDBACK_FOR.length);
      //   key = 'courseName';
      // } else if (title.startsWith(INSTRUCTOR_FEEDBACK_FOR)) {
      //   data = title.slice(INSTRUCTOR_FEEDBACK_FOR.length);
      //   key = 'instructorName';
      // }

      // skip if parsing fails for some reason
      if (data === null) return acc;

      // otherwise send the results back keyed by the question title
      return {
        ...acc,
        [key]: data,
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
  const count = recommendations.reduce((acc, val) => acc + val, 0);

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
    count,
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
