import cheerio, { CheerioAPI } from 'cheerio';
import './initFirebase';
import { getFirestore } from 'firebase-admin/firestore';
import * as ApiTypes from '../shared/apiTypes';
import fetcher, { FetchError } from '../shared/fetcher';
import { allTruthy, getClassId } from '../shared/util';
import { Season } from '../shared/types';
import { COMPONENT_MAPPING, altCommentsSectionTitle, commentsSectionTitle } from './evaluationComponents';

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
  // add the text description and id
  const ret: ApiTypes.ExtendedClass = {
    ...cls,
    id: getClassId(cls),
    textDescription: getDescriptionText(cls),
  };

  // don't fetch evaluations if we don't need to
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

export function scrapeYear($: CheerioAPI) {
  // do some processing for different formats
  const toc = $('.TOC h2').text().trim().split(' ');
  const tmpYear = parseInt(toc[4], 10);
  let year: number;
  let season: Season;

  if (tmpYear) ([year, season] = [tmpYear, toc[5] as Season]);
  else {
    const y = parseInt(toc[6], 10);
    if (isNaN(y)) {
      const yy = parseInt(toc[5], 10); // lol they keep changing the format
      ([year, season] = [yy, toc[4] as Season]);
    } else {
      ([year, season] = [y, toc[7] as Season]);
    }
  }

  return [year, season] as const;
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
  const text = $('.ChildReportSkipNav h3 > a').text();
  const [courseName = 'UNKNOWN', instructorName = 'UNKNOWN'] = text
    .slice('Feedback for'.length, text.indexOf('('))
    .split('-')
    .map((str) => str.trim());

  const [year, season] = scrapeYear($);

  // the base properties
  const evaluation: ApiTypes.Evaluation = {
    url,
    year,
    season,
    courseName,
    instructorName,
  };

  for (const el of $('.report-block').toArray()) {
    let sectionTitle = $(el).find('h3, h4').text().trim();

    // these sections contain charts that can be derived from the other data
    if (sectionTitle.startsWith('Course Feedback') || sectionTitle.startsWith('Instructor Feedback')) {
      continue;
    }

    if (sectionTitle === 'Response Rate') {
      const [invited, responded] = $(el)
        .find('tbody td')
        .map((_, td) => parseInt($(td).text().trim(), 10))
        .toArray();
      evaluation['Course Response Rate'] = { invited, responded };
      continue;
    }

    if (sectionTitle === altCommentsSectionTitle) {
      sectionTitle = commentsSectionTitle;
    }

    if (!(sectionTitle in COMPONENT_MAPPING)) {
      console.error(`Unknown component ${sectionTitle} for ${url}`);
      continue;
    }

    try {
      // @ts-ignore
      evaluation[sectionTitle] = COMPONENT_MAPPING[sectionTitle]($, el);
    } catch (err) {
      console.error(`Could not parse component ${sectionTitle} for ${url}`);
      console.error(err);
    }
  }

  return evaluation;
}
