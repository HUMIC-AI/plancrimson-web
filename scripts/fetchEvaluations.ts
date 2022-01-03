/* eslint-disable no-console */
/* eslint-disable no-await-in-loop */
import cheerio from 'cheerio';
import '../server/initFirebase';
import fs, { readFileSync } from 'fs';
import { getEvaluation } from '../server/evaluation';
import fetcher from '../shared/fetcher';
import { allTruthy } from '../shared/util';

const Q_REPORTS_COOKIE = process.env.Q_REPORTS_COOKIE!;
const BLUERA_COOKIE = process.env.BLUERA_COOKIE!;

if (!Q_REPORTS_COOKIE || !BLUERA_COOKIE) {
  throw new Error('ensure the Q_REPORTS_COOKIE and BLUERA_COOKIE env variables are set (see https://qreports.fas.harvard.edu/browse/index)');
}

const batchSize = 480;

const terms = ['2021 Spring', '2020 Fall', '2019 Fall'];

const baseUrl = 'https://qreports.fas.harvard.edu/browse/index';

/**
 * Prints a list of JSON objects to the console
 * which can be joined together using `jq --slurp` on the command line.
 */
async function downloadEvaluations() {
  const exportPath = process.argv[2];
  const urlsPath = process.argv[3];
  if (!exportPath) {
    throw new Error('pass the directory name to save the results in');
  }

  if (!fs.existsSync(exportPath)) fs.mkdirSync(exportPath);

  const evaluationUrls = urlsPath
    ? JSON.parse(readFileSync(urlsPath).toString('utf8')) as string[]
    : await Promise.all(terms.map((term) => fetcher({
      url: baseUrl,
      method: 'GET',
      params: { calTerm: term },
      headers: {
        Cookie: Q_REPORTS_COOKIE,
      },
    }).then((html) => {
      const $ = cheerio.load(html);
      return $('#bluecourses a').map((_, a) => $(a).attr('href')).toArray();
    })));

  if (evaluationUrls.some((u) => typeof u !== 'string')) {
    throw new Error('urls need to be strings');
  }

  const allUrls = evaluationUrls.flat();
  console.log(`found ${allUrls.length} evaluations`);

  for (let i = 0; i < allUrls.length; i += batchSize) {
    const urls = allUrls.slice(i, i + batchSize);
    const batchNumber = i / batchSize + 1;
    console.log(`loading ${urls.length} evaluations (${batchNumber}/${Math.ceil(allUrls.length / batchSize)})`);

    const evls = await Promise.all(urls
      .map(async (url) => {
        try {
          const evl = await getEvaluation(url, { auth: BLUERA_COOKIE });
          return evl;
        } catch (err: any) {
          console.error(`skipping evaluation at ${url}`);
          console.error(err.message);
          return null;
        }
      }));

    const loadedEvls = allTruthy(evls);
    fs.writeFileSync(`${exportPath}/batch-${batchNumber}.json`, JSON.stringify(loadedEvls));
    console.log(`done loading ${loadedEvls.length}/${urls.length} evaluations`);
  }
}

downloadEvaluations();
