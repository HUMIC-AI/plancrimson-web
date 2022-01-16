/* eslint-disable no-console */
import '../server/initFirebase';
import { getFirestore } from 'firebase-admin/firestore';
import { Evaluation } from '../shared/apiTypes';
import { getEvaluationId } from '../shared/util';

export default async function uploadEvaluations(evaluations: Evaluation[], startBatch: number = 0) {
  const db = getFirestore();
  const BATCH_SIZE = 480; // slightly less than the actual limit of 500 since I'm paranoid
  const allResults: FirebaseFirestore.WriteResult[] = [];
  for (let i = (startBatch - 1) * BATCH_SIZE; i < evaluations.length; i += BATCH_SIZE) {
    const batch = db.batch();
    const evls = evaluations.slice(i, i + BATCH_SIZE);
    const batchNum = i / BATCH_SIZE + 1;
    console.log(`uploading ${evls.length} evaluations (${batchNum}/${Math.ceil(evaluations.length / BATCH_SIZE)})`);
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
