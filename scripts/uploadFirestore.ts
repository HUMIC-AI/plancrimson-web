import '../server/initFirebase';
import { getFirestore } from 'firebase-admin/firestore';
import fs from 'fs';
import { Evaluation } from '../shared/apiTypes';
import { getEvaluationId } from '../shared/util';

async function main() {
  // if (process.argv.length < 3) throw new Error('pass file name of JSON file');
  const evaluations: Evaluation[] = JSON.parse(fs.readFileSync(process.argv[2]).toString('utf8'));
  const db = getFirestore();
  const BATCH_SIZE = 480;
  for (let i = 0; i < evaluations.length; i += BATCH_SIZE) {
    const batch = db.batch();
    const evls = evaluations.slice(i, i + BATCH_SIZE);
    console.error(`loading ${evls.length} evaluations`);
    evls.forEach((e) => batch.set(
      db.doc(`evaluations/${getEvaluationId(e)}`),
      e,
    ));
    // eslint-disable-next-line no-await-in-loop
    const results = await batch.commit();
    console.log(`wrote ${results.length} evaluations`);
  }
}

main();
