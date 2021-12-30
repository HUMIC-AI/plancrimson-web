/* eslint-disable no-await-in-loop */
import cheerio from 'cheerio';
import './initFirebase';
import { getFirestore } from 'firebase-admin/firestore';
import { getEvaluation } from '../server/evaluation';
import { Evaluation } from '../shared/apiTypes';
import fetcher, { FetchError } from '../shared/fetcher';
// import allEvaluations from '../evaluations3.json';

const Q_REPORTS_COOKIE = '_clck=j48mwa|1|ew8|0; OptanonAlertBoxClosed=2021-11-09T16:15:25.157Z; OptanonConsent=isIABGlobal=false&datestamp=Mon+Nov+29+2021+16:29:47+GMT-0500+(Eastern+Standard+Time)&version=6.15.0&hosts=&consentId=44fa3662-4b23-4918-9e16-713114936874&interactionCount=1&landingPath=NotLandingPage&groups=C0001:1,C0002:1,C0003:1,C0004:1,C0005:1&geolocation=US;&AwaitingReconsent=false; JSESSIONID=BE87F77563AEEA6BBB6576A86F2653D4';
const BLUERA_COOKIE = 'cookiesession1=678B2900234567898901234ABCEFBA23; GDPR_tokenf17de2b2277e4e8c38e7a9303a75868af96b9afa7d12939a7012b3869de24863=f17de2b2277e4e8c38e7a9303a75868af96b9afa7d12939a7012b3869de24863; ASP.NET_SessionId=4ibutszl05oe3c2toejr0mlu; CookieName=D858E1561009188AD2EC29E18007A3E0E036DBC1C60C7C0E466D678A0C9A42F4CBC553A9A6F17E696B2CC14D5168A8D32E711C93E5330780DEB69EE0F6B670F4FC8FABB6F187770E6575807F09B034F936DC16931A526504C9C36A33390A93E4F7033CADD5A4578AD65C3A92D974FE94F3D16E00F242AB9DA5C9B82179BF08A8FF0EFD92B446B7AC4DF04F9A83C78FC7BBD95C2D205C725040725BD60D8491E0; session_token=4e538aef509542d3902587caf7f535f4';

function getEvaluationId(evaluation: Evaluation) {
  return [
    evaluation.courseName,
    evaluation.instructorName,
    evaluation.year,
    evaluation.season].join('-').replace(/[^a-zA-Z0-9]/g, '-');
}

const batchSize = 480;

async function uploadEvaluations(evaluations: Evaluation[]) {
  const db = getFirestore();
  for (let i = 0; i < evaluations.length; i += batchSize) {
    const batchWriter = db.batch();
    evaluations.slice(i, i + batchSize).forEach(
      (evaluation) => batchWriter.set(
        db.doc(`evaluations/${getEvaluationId(evaluation)}`),
        evaluation,
      ),
    );
    await batchWriter.commit();
  }
  // console.log(`wrote ${results.length} evaluations to firestore`);
}

const qReportUrls = [
  'https://qreports.fas.harvard.edu/browse/index?calTerm=2021%20Spring',
  'https://qreports.fas.harvard.edu/browse/index?calTerm=2020%20Fall',
  'https://qreports.fas.harvard.edu/browse/index?calTerm=2019%20Fall',
];

/**
 * Prints a list of JSON objects to the console
 * which can be joined together using `jq --slurp` on the command line.
 */
async function downloadEvaluations({ autoUpload = false }: { autoUpload?: boolean } = {}) {
  const evaluationUrls = await Promise.all(qReportUrls.map((url) => fetcher({
    url,
    method: 'GET',
    headers: {
      Cookie: Q_REPORTS_COOKIE,
    },
  }).then((html) => {
    const $ = cheerio.load(html);
    return $('#bluecourses a').map((_, a) => $(a).attr('href')).toArray();
  })));

  const allUrls = evaluationUrls.flat();

  try {
    for (let i = 0; i < allUrls.length; i += batchSize) {
      const evls = await Promise.all(allUrls.slice(i, i + batchSize)
        .map((url) => getEvaluation(url, { auth: BLUERA_COOKIE })));
      if (autoUpload) await uploadEvaluations(evls);
      evls.forEach((evl) => console.log(JSON.stringify(evl, null, 2)));
    }
  } catch (err) {
    const { message } = err as Error;
    console.error(message);
  }
}

downloadEvaluations({ autoUpload: true });
