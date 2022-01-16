/* eslint-disable no-console */
import axios from 'axios';
import cheerio from 'cheerio';
import {
  existsSync, mkdirSync, readFileSync, writeFileSync,
} from 'fs';

const cookie = process.env.COURSE_EVALUATIONS_COOKIE!;

if (!cookie) {
  throw new Error('need cookie');
}

const baseUrl = 'https://course-evaluation-reports.fas.harvard.edu/fas/view_comments.html';

const BATCH_SIZE = 100;

async function main() {
  const courseIdsFile = process.argv[2];
  const outDir = process.argv[3];
  if (!courseIdsFile || !outDir) { throw new Error('pass course ids json file and output directory'); }
  if (!existsSync(outDir)) mkdirSync(outDir);
  const ids = readFileSync(courseIdsFile);
  const courseIds: string[] = JSON.parse(ids.toString('utf8'));
  courseIds.reverse();
  const nBatches = Math.ceil(courseIds.length / BATCH_SIZE);

  const startBatch = parseInt(process.argv[4], 10) - 1 || 0;

  for (let i = startBatch * BATCH_SIZE; i < courseIds.length; i += BATCH_SIZE) {
    const batchIds = courseIds.slice(i, i + BATCH_SIZE);
    const batch = i / BATCH_SIZE + 1;
    console.log(
      `loading batch ${batch} / ${nBatches} with ${batchIds.length} pages`,
    );
    // eslint-disable-next-line no-await-in-loop
    const results = await Promise.all(
      batchIds.map(async (id: string, j) => {
        try {
          // eslint-disable-next-line no-promise-executor-return
          const response = await axios.get(baseUrl, {
            params: {
              course_id: id,
              qid: 1487,
            },
            headers: {
              Cookie: cookie,
            },
          });

          const $ = cheerio.load(response.data);
          const data = $('.response')
            .map((_, el) => $(el).text().replace(/\s+/g, ' ').trim())
            .toArray();
          console.log(
            `loading course ${j} (id ${id}) found ${data.length} responses`,
          );

          return { [id]: data };
        } catch (err: any) {
          console.error(`error loading course ${id}: ${err.message}`);
          return {};
        }
      }),
    );

    const acc = Object.assign({}, ...results);

    writeFileSync(`${outDir}/batch-${batch}.json`, JSON.stringify(acc));

    console.log(`===== done batch ${batch}`);
  }
}

main();
