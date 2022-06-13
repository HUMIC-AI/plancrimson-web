/* eslint-disable @typescript-eslint/no-use-before-define */
import cheerio, { AnyNode, BasicAcceptedElems, CheerioAPI } from 'cheerio';
import './initFirebase';
import { getFirestore } from 'firebase-admin/firestore';
import * as ApiTypes from '../shared/apiTypes';
import fetcher, { FetchError } from '../shared/fetcher';
import { allTruthy, getClassId } from '../shared/util';
import { Season } from '../shared/types';

type Scraper<T> = ($: CheerioAPI, el: BasicAcceptedElems<AnyNode>) => T;

async function fetchEvaluations(
  courseName: string,
): Promise<ApiTypes.Evaluation[]> {
  const db = getFirestore();
  const evaluations = await db
    .collection('evaluations')
    .where('courseName', '==', courseName)
    .get();
  return evaluations.docs.map((doc) => doc.data() as ApiTypes.Evaluation);
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
export async function extendClass(cls: ApiTypes.Class, withEvals = true) {
  const ret: ApiTypes.ExtendedClass = {
    ...cls,
    id: getClassId(cls),
    textDescription: getDescriptionText(cls),
  };
  if (!withEvals) return ret;
  try {
    const evals = await fetchEvaluations(cls.SUBJECT + cls.CATALOG_NBR);
    console.error(
      `found ${evals.length} evaluations for ${cls.SUBJECT}${cls.CATALOG_NBR}`,
    );
    if (evals.length === 0) return ret;

    const classSizes = allTruthy(
      evals.map((evl) => evl['Course Response Rate']?.invited),
    );
    if (classSizes.length > 0) {
      ret.meanClassSize = classSizes.reduce((acc, val) => acc + val, 0) / classSizes.length;
    }

    const ratings = allTruthy(
      evals.map((evl) => {
        const data = evl['Course General Questions']?.['Evaluate the course overall.'];
        if (!data?.courseMean) return null;
        return { mean: data.courseMean, count: data.count };
      }),
    );
    if (ratings.length > 0) {
      ret.meanRating = calcMean(ratings);
    }

    const recommendations = evals
      .map(
        (evl) => evl['How strongly would you recommend this course to your peers?'],
      )
      .filter((val) => val?.mean && val.count);
    if (recommendations.length > 0) {
      ret.meanRecommendation = calcMean(recommendations as Mean[]);
    }

    const hours = evals
      .map(
        (evl) => evl[
          'On average, how many hours per week did you spend on coursework outside of class? Enter a whole number between 0 and 168.'
        ],
      )
      .filter((val) => val?.mean && val.count);
    if (hours.length > 0) {
      ret.meanHours = calcMean(hours as Mean[]);
    }
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
  return ret;
}

export function getDescriptionText(course: ApiTypes.Class) {
  try {
    const $ = cheerio.load(course.IS_SCL_DESCR);
    return $.text();
  } catch (err) {
    return course.IS_SCL_DESCR;
  }
}

export async function getEvaluation(
  url: string,
  { auth }: { auth: string },
): Promise<ApiTypes.Evaluation> {
  const response = await fetcher({
    method: 'GET',
    url,
    headers: {
      Cookie: auth,
    },
  });

  const $ = cheerio.load(response);
  const text = $('.ChildReportSkipNav h3 a').text();
  const [courseName = 'UNKNOWN', instructorName = 'UNKNOWN'] = text
    .slice('Feedback for '.length, text.indexOf('('))
    .split('-')
    .map((str) => str.trim());
  const toc = $('.TOC h2').text().trim().split(' ');
  const tmpYear = parseInt(toc[4], 10);
  const [year, season] = tmpYear
    ? [tmpYear, toc[5] as Season]
    : [parseInt(toc[6], 10), toc[7] as Season];
  const initial: ApiTypes.Evaluation = {
    url,
    year,
    season,
    courseName,
    instructorName,
  };

  return $('.report-block')
    .toArray()
    .reduce((acc, el) => {
      let title = $(el).find('h3, h4').text().trim();

      let data = null;

      try {
        if (title === 'Course Response Rate') {
          data = getResponseRate($, el);
        } else if (title === 'Response Rate') {
          title = 'Course Response Rate';
          const [invited, responded] = $(el)
            .find('tbody td')
            .map((_, td) => parseInt($(td).text().trim(), 10))
            .toArray();
          data = { invited, responded };
        } else if (title === 'Course General Questions') {
          data = getGeneralQuestions($, el);
        } else if (title === 'General Instructor Questions') {
          data = getGeneralQuestions($, el);
        } else if (
          title
          === 'On average, how many hours per week did you spend on coursework outside of class? Enter a whole number between 0 and 168.'
        ) {
          data = getHours($, el);
        } else if (
          title
          === 'How strongly would you recommend this course to your peers?'
        ) {
          data = getRecommendations($, el);
        } else if (
          title
          === 'What was/were your reason(s) for enrolling in this course? (Please check all that apply)'
        ) {
          data = getReasons($, el);
        } else if (
          title
          === 'What would you like to tell future students about this class?'
        ) {
          data = getComments($, el);
        } else {
          if (
            !['Course Feedback', 'Instructor Feedback'].some((ignoredHeading) => title.startsWith(ignoredHeading))
          ) {
            console.error(`unknown heading (${url}): ${title}`);
          }
          // if this element is unimportant
          return acc;
        }
      } catch (err) {
        console.error(`error parsing ${title} when loading ${url}`);
        console.error((err as Error).message);
        return acc;
      }

      return {
        ...acc,
        [title]: data,
      };
    }, initial);
}

const getResponseRate: Scraper<ApiTypes.CourseResponseRate> = ($, el) => {
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
const getGeneralQuestions: Scraper<ApiTypes.CourseGeneralQuestions> = ($, el) => $(el)
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
    const votes = row
      .slice(2, 7)
      .map((v) => Math.round((parseInt(v, 10) * count) / 100));
    const courseMean = parseFloat(row[7]);
    const fasMean = parseFloat(row[8]);
    const ret: ApiTypes.CourseGeneralQuestions = {
      ...acc,
      [title]: {
        count,
        votes,
        courseMean,
        fasMean,
      },
    };
    return ret;
  }, {} as ApiTypes.CourseGeneralQuestions);

const getRecommendations: Scraper<ApiTypes.RecommendationsStats> = ($, el) => {
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
    });
  const count = recommendations.reduce((acc, val) => acc + val, 0);

  const stats = tables
    .last()
    .find('td')
    .toArray()
    .map((td) => parseFloat($(td).text().trim().replace('%', '')));

  if (stats.length === 5) {
    const [ratio, mean, median, , stdev] = stats;
    return {
      recommendations,
      count,
      ratio,
      mean,
      median,
      stdev,
    };
  }

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

const getHours: Scraper<ApiTypes.HoursStats> = ($, el) => {
  const nums = $(el)
    .find('tbody td')
    .map((_, td) => parseFloat($(td).text().trim().replace('%', '')))
    .toArray();
  if (nums.length !== 6) {
    throw new Error('Could not read course hours');
  }
  const [count, ratio, mean, median, mode, stdev] = nums;
  return {
    count,
    ratio,
    mean,
    median,
    mode,
    stdev,
  };
};

const getReasons: Scraper<ApiTypes.ReasonsForEnrolling> = ($, el) => {
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
    elective,
    concentration,
    secondary,
    gened,
    expos,
    language,
    premed,
    distribution,
    qrd,
  };
};

const getComments: Scraper<string[]> = ($, el) => $(el)
  .find('tbody td')
  .map((_, td) => $(td).text().trim())
  .toArray();
