/* eslint-disable no-console */
import axios from 'axios';
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
