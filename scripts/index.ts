import axios from 'axios';
import { FieldValue, getFirestore } from 'firebase-admin/firestore';
import inquirer from 'inquirer';
import downloadData from './downloadData';
import fetchCsTags from './fetchCsTags';
import fetchEvaluations from './fetchEvaluations';
import fetchOldEvaluations from './fetchOldEvaluations';
import fetchSyllabi from './fetchSyllabi';
import migration20220610 from './migrations';
import fetchStatistics from './statistics';
import uploadData from './uploadData';
import uploadEvaluations from './uploadEvaluations';

function newLabel(text: string) {
  return {
    label: new inquirer.Separator(`========== ${text} ==========`),
    async run() {
      console.log('Oops');
    },
  };
}

const commands = [
  newLabel('Courses'),
  downloadData,
  uploadData,
  newLabel('Evaluations'),
  fetchEvaluations,
  fetchOldEvaluations,
  uploadEvaluations,
  fetchSyllabi,
  {
    label: 'Fix evaluations (remove wrong comments key)',
    async run() {
      const shortKey = 'What would you like to tell future students about this class?';
      // const longKey = 'What would you like to tell future students about this class? (Your response to this question may be published anonymously.)';
      // const data = await getFirestore().collection('evaluations').get();
      const data = await getFirestore().collection('evaluations').where(shortKey, '!=', null).get();
      const results = await Promise.allSettled(data.docs.map(async (snap) => {
        const d = snap.data();
        // if (longKey in d) {
        //   await snap.ref.set({
        //     comments: d[longKey],
        //     'What would you like to tell future students about this class?': FieldValue.delete(),
        //     [longKey]: FieldValue.delete()
        //   }, { merge: true });
        //   console.log('set', snap.id);
        // } else if (shortKey in d) {
        await snap.ref.set({
          comments: d[shortKey],
          [shortKey]: FieldValue.delete(),
        }, { merge: true });
        // }
      }));
      console.log(results.filter((d) => d.status === 'rejected'), results.length);
    },
  },
  newLabel('Department specific'),
  {
    label: 'Download the SEAS Four Year Plan course data',
    async run() {
      const { data } = await axios.get(
        'https://info.seas.harvard.edu/courses/api/schedule/courses',
      );
      console.log(data);
    },
  },
  {
    label: 'Download the SEAS Four Year Plan public data',
    async run() {
      const { data } = await axios.get(
        'https://info.seas.harvard.edu/courses/api/courses/public',
      );
      console.log(data);
    },
  },
  fetchCsTags,
  newLabel('Statistics'),
  fetchStatistics,
  newLabel('Accounts'),
  {
    label: 'Migrate users',
    run: migration20220610,
  },
];

async function main() {
  if (!process.env.FIRESTORE_EMULATOR_HOST) {
    console.log(
      'Firebase is not connected to emulators. Set the FIRESTORE_EMULATOR_HOST environment variable (eg to "localhost:8080") to connect',
    );
  } else {
    console.log('Connected to Firebase Emulator Suite');
  }

  const { command } = await inquirer.prompt([
    {
      name: 'command',
      message: 'What would you like to do?',
      type: 'list',
      choices: commands.map((cmd) => cmd.label),
    },
  ]);

  try {
    await commands.find((c) => c.label === command)!.run();
  } catch (err) {
    console.error(err);
  }
}

main().catch((err) => console.error(err));
