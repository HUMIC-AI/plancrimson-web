/* eslint-disable @typescript-eslint/no-use-before-define */
import cheerio, { BasicAcceptedElems, CheerioAPI, Node } from 'cheerio';
import axios from 'axios';

type Scraper = ($: CheerioAPI, el: BasicAcceptedElems<Node>) => any;

export default async function getAllEvaluations(school: string, course: string) {
  const response = await axios({
    method: 'GET',
    url: 'https://qreports.fas.harvard.edu/home/courses',
    params: {
      school,
      search: course,
    },
    headers: {
      Origin: 'https://portal.my.harvard.edu',
      Cookie: process.env.MY_HARVARD_COOKIE as string,
    },
  });

  const html = response.data;
  const $ = cheerio.load(html);
  if ($('title').text() === 'HarvardKey - Harvard University Authentication Service') {
    throw new Error('Must reauthenticate');
  }

  const promises = $('#dtCourses > tbody > tr a')
    .map((_, a) => {
      const url = $(a).attr('href');
      if (!url) return null;
      try {
        return getEvaluation(url);
      } catch (err: any) {
        console.error(err.message);
        return null;
      }
    })
    .toArray();

  if (promises.length === 0) {
    return null;
  }

  const results = await Promise.all(promises);

  return results.filter((el) => el !== null);
}

async function getEvaluation(url: string) {
  const response = await axios({
    method: 'GET',
    url,
    headers: {
      Cookie: process.env.BLUERA_COOKIE as string,
    },
  });
  const $ = cheerio.load(response.data);
  return $('.report-block').toArray().reduce((acc, el) => {
    const title = $(el).find('h3, h4').text().trim();

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
    }

    console.error('unexpected case:', title);

    return {
      ...acc,
      [title]: data,
    };
  }, {});
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
    const [
      title,
      count,
      excellent,
      veryGood,
      good,
      fair,
      unsatisfactory,
      courseMean,
      fasMean,
    ] = row;
    return {
      ...acc,
      [title]: {
        courseMean: parseFloat(courseMean),
        fasMean: parseFloat(fasMean),
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
