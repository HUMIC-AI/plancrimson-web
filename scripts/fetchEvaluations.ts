/* eslint-disable no-console */
/* eslint-disable no-await-in-loop */
import cheerio from 'cheerio';
import '../server/initFirebase';
import { getFirestore } from 'firebase-admin/firestore';
import { getEvaluation } from '../server/evaluation';
import { Evaluation } from '../shared/apiTypes';
import fetcher from '../shared/fetcher';
import { allTruthy } from '../shared/util';

const Q_REPORTS_COOKIE = '_clck=j48mwa|1|ew8|0; OptanonAlertBoxClosed=2021-11-09T16:15:25.157Z; OptanonConsent=isIABGlobal=false&datestamp=Mon+Nov+29+2021+16:29:47+GMT-0500+(Eastern+Standard+Time)&version=6.15.0&hosts=&consentId=44fa3662-4b23-4918-9e16-713114936874&interactionCount=1&landingPath=NotLandingPage&groups=C0001:1,C0002:1,C0003:1,C0004:1,C0005:1&geolocation=US;&AwaitingReconsent=false; JSESSIONID=249E579489510E7D261A19FDB792D7DD';
const BLUERA_COOKIE = 'cookiesession1=678B2900234567898901234ABCEFBA23; GDPR_tokenf17de2b2277e4e8c38e7a9303a75868af96b9afa7d12939a7012b3869de24863=f17de2b2277e4e8c38e7a9303a75868af96b9afa7d12939a7012b3869de24863; ASP.NET_SessionId=rxgxxowjxc5yp3c1fefq5q5q; CookieName=9B7E283331B1AAC461BC4EC3C2A62ACD3C8B1805BDD9CF16E5FECA6F98023ACC895E6F7490023FF0C3EB4B0F05D94D13260B13669EA8BB6A18FD5482DAB403535C5D4C0F8913F11232220798429915348AF1B73C173B254A61F11863D316B1F920F171ED12678FA262BA9662B6796F5FF95C7D9FB4740947AED50653C2F1A9FF9725A52C91CFBF65871510DD6FE6E54B06BF7B89398DD632253A053154B3535F; session_token=f539d86066274f12986d6650e2ef0b95';

function getEvaluationId(evaluation: Evaluation) {
  return [
    evaluation.courseName,
    evaluation.instructorName,
    evaluation.year,
    evaluation.season]
    .map((val) => val || 'UNKNOWN')
    .join('-')
    .replace(/[^a-zA-Z0-9]/g, '-');
}

const batchSize = 480;

async function uploadEvaluations(evaluations: Evaluation[]) {
  console.error(`writing ${evaluations.length} evaluations to firestore`);
  const db = getFirestore();
  let total = 0;
  for (let i = 0; i < evaluations.length; i += batchSize) {
    const batchWriter = db.batch();
    evaluations.slice(i, i + batchSize).forEach(
      (evaluation) => batchWriter.set(
        db.doc(`evaluations/${getEvaluationId(evaluation)}`),
        evaluation,
      ),
    );
    const results = await batchWriter.commit();
    total += results.length;
  }
  console.error(`wrote ${total} evaluations to firestore`);
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
  console.error(`found ${allUrls.length} evaluations`);

  for (let i = 0; i < allUrls.length; i += batchSize) {
    const urls = allUrls.slice(i, i + batchSize);
    console.error(`loading ${urls.length} evaluations (${i + 1}/${Math.ceil(allUrls.length / batchSize)})`);

    const evls = await Promise.all(urls
      .map(async (url) => {
        try {
          const evl = await getEvaluation(url, { auth: BLUERA_COOKIE });
          return evl;
        } catch (err) {
          console.error(`skipping evaluation at ${url}`);
          console.error(err);
          return null;
        }
      }));
    const loadedEvls = allTruthy(evls);
    if (autoUpload) await uploadEvaluations(loadedEvls);
    loadedEvls.forEach((evl) => {
      console.log(JSON.stringify(evl, null, 2));
    });
    console.error(`done loading ${loadedEvls.length} evaluations`);
  }
}

downloadEvaluations({ autoUpload: true });
