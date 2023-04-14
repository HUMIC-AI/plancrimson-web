/* eslint-disable no-console, no-promise-executor-return */
import axios from 'axios';
import { writeFileSync } from 'fs';
import qs from 'qs';
import inquirer from 'inquirer';
import { extendClass } from '../server/evaluation';
import { Class, ExtendedClass, MyHarvardResponse } from '../shared/apiTypes';
import { FetchError } from '../shared/fetcher';
import { allTruthy } from '../shared/util';
import { getFilePath } from './util';

// number of my.harvard pages in a batch
const BATCH_SIZE = 15;
const searchUrl = 'https://portal.my.harvard.edu/psc/hrvihprd/EMPLOYEE/EMPL/s/WEBLIB_IS_SCL.ISCRIPT1.FieldFormula.IScript_Search';

/**
 * Gets a page of classes from my.harvard.
 * @param pageNumber the page number to get
 * @param searchText the search text to use
 * @param cookie the cookie to use
 */
function getPage({
  pageNumber,
  searchText,
  cookie,
}: {
  pageNumber: number;
  searchText: string;
  cookie: string;
}) {
  return axios<MyHarvardResponse>({
    url: searchUrl,
    method: 'POST',
    headers: {
      Cookie: cookie,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    data: qs.stringify({
      SearchReqJSON: JSON.stringify({
        PageNumber: pageNumber,
        PageSize: '',
        SortOrder: ['SCORE'],
        Facets: [],
        Category: 'HU_SCL_SCHEDULED_BRACKETED_COURSES',
        SearchPropertiesInResults: true,
        FacetsInResults: true,
        SaveRecent: false,
        TopN: '',
        ExcludeBracketed: true,
        SearchText: searchText,
        DeepLink: false,
      }),
    }),
  });
}

async function downloadPage(
  pageNumber: number,
  searchText: string,
  cookie: string,
) {
  console.log(`started downloading page ${pageNumber}`);

  const { data: response } = await getPage({ pageNumber, searchText, cookie });

  const promises = response[0].ResultsCollection.map(async (cls): Promise<ExtendedClass> => {
    try {
      const extended = await extendClass(cls);
      return extended;
    } catch (err) {
      const { info, message } = err as FetchError;
      console.error('Error extending class data', message, info.error);
      return info.data;
    }
  });

  const classes = await Promise.all<ExtendedClass>(promises);

  return classes;
}

/**
 * Download data from my.harvard.
 * @param baseDir the base directory to save the data to
 */
async function fetchAllData(baseDir: string) {
  const MY_HARVARD_COOKIE = process.env.MY_HARVARD_COOKIE!;
  const GOOGLE_APPLICATION_CREDENTIALS = process.env.GOOGLE_APPLICATION_CREDENTIALS!;
  if (!MY_HARVARD_COOKIE || !GOOGLE_APPLICATION_CREDENTIALS) {
    throw new Error(
      'must set MY_HARVARD_COOKIE and GOOGLE_APPLICATION_CREDENTIALS env variables',
    );
  }

  const { searchText } = await inquirer.prompt([
    {
      type: 'input',
      name: 'searchText',
      message: 'Search text for my.harvard:',
      default: '( * ) (ACAD_CAREER:"FAS")',
    },
  ]);

  const { data: firstPage } = await getPage({
    pageNumber: 1,
    searchText,
    cookie: MY_HARVARD_COOKIE,
  });

  const { TotalPages, HitCount, PageSize } = firstPage[2];

  if (!TotalPages) {
    throw new Error('could not get my.harvard information');
  }

  const nBatches = Math.ceil(TotalPages / BATCH_SIZE);

  console.log(`===== SUMMARY =====
${HitCount} courses
in ${TotalPages} pages of ${PageSize} courses each
to be loaded in ${nBatches} batches of ${BATCH_SIZE} pages each`);

  const { startBatch } = await inquirer.prompt([
    {
      type: 'number',
      default: 1,
      name: 'startBatch',
      validate: (num) => (num >= 1 && num <= nBatches
        ? true
        : `Must be between 1 and ${nBatches} inclusive`),
      message: 'Start at batch:',
    },
  ]);

  for (let batch = startBatch; batch <= nBatches; batch += 1) {
    console.log(`Starting batch ${batch}/${nBatches}`);
    const startPage = (batch - 1) * BATCH_SIZE;
    const endPage = Math.min(batch * BATCH_SIZE, TotalPages); // inclusive
    const { fulfilled, rejected } = await processBatch(startPage, endPage, searchText, MY_HARVARD_COOKIE);

    console.log(
      `Done batch ${batch}/${nBatches} with ${fulfilled.length} successful pages`,
    );
    writeFileSync(`${baseDir}/batch${batch}.json`, JSON.stringify(fulfilled));
    console.error(JSON.stringify(rejected, null, 2));
  }
}

async function processBatch(startPage: number, endPage: number, searchText: string, cookie: string) {
  const promises: Promise<ExtendedClass[]>[] = [];

  for (
    let pageNumber = startPage + 1;
    pageNumber <= endPage;
    pageNumber += 1
  ) {
    promises.push(
      new Promise((resolve, reject) => setTimeout(() => {
        downloadPage(pageNumber, searchText, cookie)
          .then(resolve)
          // eslint-disable-next-line prefer-promise-reject-errors
          .catch((err) => reject({ pageNumber, message: err.message }));
      }, 200 * (pageNumber - startPage))), // stagger requests every 200ms
    );
  }

  const settled = await Promise.allSettled(promises);

  const fulfilled = allTruthy(
    settled.map((v) => (v.status === 'fulfilled' ? v.value : null)),
  ).flat();
  const rejected = allTruthy(
    settled.map((v) => (v.status === 'rejected' ? v.reason as { pageNumber: number, message: string } : null)),
  );

  return { fulfilled, rejected };
}

export default {
  label: 'Download course data from my.harvard',
  async run() {
    const filePath = await getFilePath(
      'Path to directory to download into:',
      'data/courses/courses',
    );
    try {
      await fetchAllData(filePath);
    } catch (err) {
      console.error(err);
    }
  },
};
