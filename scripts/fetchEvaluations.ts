/* eslint-disable no-console */
/* eslint-disable no-await-in-loop */
import cheerio from 'cheerio';
import inquirer from 'inquirer';
import '../server/initFirebase';
import fs from 'fs';
import { getEvaluation } from '../server/evaluation';
import fetcher from '../shared/fetcher';
import { allTruthy } from '../shared/util';
import { getFilePath } from './util';

const batchSize = 480;

const terms = ['2021 Fall', '2021 Spring', '2020 Fall', '2019 Fall'];

const baseUrl = 'https://qreports.fas.harvard.edu/browse/index';

async function defaultUrls() {
  const selectedTerms = (
    await inquirer.prompt([
      {
        type: 'checkbox',
        name: 'selectedTerms',
        message: 'Which terms do you want to download?',
        choices: terms,
      },
    ])
  ).selectedTerms as string[];

  const urls = await Promise.all(
    selectedTerms.map((term) => fetcher({
      url: baseUrl,
      method: 'GET',
      params: { calTerm: term },
      headers: {
        Cookie: process.env.Q_REPORTS_COOKIE!,
      },
    }).then((html) => {
      const $ = cheerio.load(html);
      return $('#bluecourses a')
        .map((_, a) => $(a).attr('href')!)
        .toArray();
    })),
  );

  return urls.flat();
}

/**
 * Prints a list of JSON objects to the console
 * which can be joined together using `jq --slurp` on the command line.
 */
async function downloadEvaluations(exportPath: string, evaluationUrls?: string[]) {
  if (!evaluationUrls) {
    // eslint-disable-next-line no-param-reassign
    evaluationUrls = await defaultUrls();
  }

  const invalidUrls = evaluationUrls.filter((u) => typeof u !== 'string');

  if (invalidUrls.length > 0) {
    throw new Error(
      `urls need to be strings but received ${JSON.stringify(invalidUrls)}`,
    );
  }

  console.log(`found ${evaluationUrls.length} evaluations`);

  for (let i = 0; i < evaluationUrls.length; i += batchSize) {
    const urls = evaluationUrls.slice(i, i + batchSize);
    const batchNumber = i / batchSize + 1;
    console.log(
      `loading ${urls.length} evaluations (${batchNumber}/${Math.ceil(
        evaluationUrls.length / batchSize,
      )})`,
    );

    const evls = await Promise.all(
      urls.map(async (url, j) => {
        try {
          // rate limit ourselves to one request per 200ms
          // eslint-disable-next-line no-promise-executor-return
          await new Promise((resolve) => setTimeout(resolve, 200 * j));
          const evl = await getEvaluation(url, { auth: process.env.BLUERA_COOKIE! });
          return evl;
        } catch (err: any) {
          console.error(`skipping evaluation at ${url}: ${err.message}`);
          return null;
        }
      }),
    );

    const loadedEvls = allTruthy(evls);
    fs.writeFileSync(
      `${exportPath}/batch-${batchNumber}.json`,
      JSON.stringify(loadedEvls),
    );
    console.log(`done loading ${loadedEvls.length}/${urls.length} evaluations`);
  }
}

export default {
  label: 'Fetch Q Reports',
  async run() {
    if (!process.env.Q_REPORTS_COOKIE || !process.env.BLUERA_COOKIE) {
      throw new Error(
        'ensure the Q_REPORTS_COOKIE and BLUERA_COOKIE env variables are set (see https://qreports.fas.harvard.edu/browse/index)',
      );
    }
    const filepath = await getFilePath('Directory to store results in:', 'data/evaluations/qreports');
    await downloadEvaluations(filepath);
  },
};
