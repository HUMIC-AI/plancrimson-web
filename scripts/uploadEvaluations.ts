/* eslint-disable no-console */
import '../server/initFirebase';
import { getFirestore } from 'firebase-admin/firestore';
import inquirer from 'inquirer';
import {
  existsSync, lstatSync, readdirSync, readFileSync,
} from 'fs';
import { join } from 'path';
import { Evaluation } from '../shared/apiTypes';
import { getEvaluationId } from '../shared/util';
import { getFilePath } from './util';

async function uploadEvaluations(
  evaluations: Evaluation[],
  startBatch: number = 0,
) {
  const db = getFirestore();
  const BATCH_SIZE = 480; // slightly less than the actual limit of 500 since I'm paranoid
  const allResults: FirebaseFirestore.WriteResult[] = [];
  for (
    let i = (startBatch - 1) * BATCH_SIZE;
    i < evaluations.length;
    i += BATCH_SIZE
  ) {
    const batch = db.batch();
    const evls = evaluations.slice(i, i + BATCH_SIZE);
    const batchNum = i / BATCH_SIZE + 1;
    console.log(
      `uploading ${evls.length} evaluations (${batchNum}/${Math.ceil(
        evaluations.length / BATCH_SIZE,
      )})`,
    );
    evls.forEach((e) => batch.set(db.doc(`evaluations/${getEvaluationId(e)}`), e));
    // eslint-disable-next-line no-await-in-loop
    const results = await batch.commit();
    console.log(`wrote ${results.length} evaluations`);
    allResults.push(...results);
  }
  return allResults;
}

function getAllEvaluations(filepath: string): Evaluation[] {
  if (!existsSync(filepath)) throw new Error(`Path ${filepath} does not exist`);
  const data = lstatSync(filepath);
  if (data.isDirectory()) {
    return readdirSync(filepath).flatMap((nestedPath) => getAllEvaluations(join(filepath, nestedPath)));
  }
  if (data.isFile()) {
    // hopefully this is an evaluation, we only check if it's an array
    const evaluations: Evaluation[] = JSON.parse(readFileSync(filepath).toString('utf8'));
    if (!Array.isArray(evaluations)) throw new Error(`The file at ${filepath} is not a JSON array`);
    return evaluations;
  }
  throw new Error(`Unrecognized file ${filepath}`);
}

export default {
  label: 'Upload evaluations from a file to firestore',
  async run() {
    if (!process.env.GOOGLE_APPLICATION_CREDENTIALS) {
      throw new Error('Set the GOOGLE_APPLICATION_CREDENTIALS env variable');
    }
    const filePath = await getFilePath(
      'File path to evaluations to read from:',
      'data/evaluations/evaluations',
      true,
    );
    const evaluations: Evaluation[] = getAllEvaluations(filePath);
    console.log(`uploading ${evaluations.length} total evaluations`);
    const { startBatch } = await inquirer.prompt([
      {
        name: 'startBatch',
        type: 'number',
        message: 'Batch to start at:',
        default: 1,
      },
    ]);
    const results = await uploadEvaluations(evaluations, startBatch);
    console.log(`wrote ${results.length} results`);
  },
};
