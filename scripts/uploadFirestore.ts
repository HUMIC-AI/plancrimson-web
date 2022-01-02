import '../server/initFirebase';
import { getFirestore } from 'firebase-admin/firestore';
import fs from 'fs';
import { Evaluation } from '../shared/apiTypes';
import { getEvaluationId } from '../shared/util';

export default async function uploadEvaluations(evaluations: Evaluation[]) {
  const db = getFirestore();
  const BATCH_SIZE = 480;
  const allResults: FirebaseFirestore.WriteResult[] = [];
  for (let i = 0; i < evaluations.length; i += BATCH_SIZE) {
    const batch = db.batch();
    const evls = evaluations.slice(i, i + BATCH_SIZE);
    console.log(`loading ${evls.length} evaluations`);
    evls.forEach((e) => batch.set(
      db.doc(`evaluations/${getEvaluationId(e)}`),
      e,
    ));
    // eslint-disable-next-line no-await-in-loop
    const results = await batch.commit();
    console.log(`wrote ${results.length} evaluations`);
    allResults.push(...results);
  }
  return allResults;
}

if (require.main === module) {
  const filePath = process.argv[2];
  if (!filePath) throw new Error('must specify path to load evaluations from');
  const data = fs.readFileSync(filePath).toString('utf8');
  const evaluations = JSON.parse(data);
  uploadEvaluations(evaluations)
    .then((results) => console.log(`wrote ${results.length} results`))
    .catch((err) => console.error(err));
}
