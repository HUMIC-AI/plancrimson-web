/* eslint-disable no-console */
import axios from 'axios';
import { existsSync, mkdirSync, readFileSync } from 'fs';
import inquirer from 'inquirer';
import downloadData from './downloadData';
import fetchCsTags from './fetchCsTags';
import fetchOldEvaluations, { TermString } from './fetchOldEvaluations';
import fetchSyllabi from './fetchSyllabi';
import uploadData from './uploadData';
import uploadEvaluations from './uploadEvaluations';
import subjects from '../src/subjects.json';

async function getFilePath(message: string, prefix?: string) {
  const question: inquirer.DistinctQuestion = {
    name: 'filePath',
    type: 'input',
    message,
  };
  if (prefix) {
    question.default = `${prefix}-${new Date().toISOString().slice(0, 10)}`;
  }
  const { filePath } = await inquirer.prompt([question]);
  if (existsSync(filePath)) {
    const { confirm } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'confirm',
        message:
          'That directory already exists. Continue? This may overwrite existing files!',
      },
    ]);
    if (!confirm) throw new Error('That directory already exists');
  } else {
    mkdirSync(filePath, { recursive: true });
  }

  return filePath.replace(/\/$/, ''); // remove trailing
}

const commands = [
  {
    label: 'Download course data from my.harvard',
    async run() {
      const filePath = await getFilePath(
        'Path to directory to download into:',
        'data/courses/courses',
      );
      try {
        await downloadData(filePath);
      } catch (err) {
        console.error(err);
      }
    },
  },
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
  {
    label: 'Upload course data from a file to MeiliSearch',
    async run() {
      const { filepath } = await inquirer.prompt([
        {
          name: 'filepath',
          message: 'Which file would you like to upload to MeiliSearch?',
          type: 'input',
        },
      ]);
      if (!existsSync(filepath)) {
        throw new Error('file does not exist');
      }
      await uploadData(JSON.parse(readFileSync(filepath).toString('utf8')));
    },
  },
  {
    label: 'Fetch all course evaluations',
    async run() {
      const { startTerm, endTerm } = await inquirer.prompt([
        {
          name: 'startTerm',
          type: 'input',
          message:
            'Start term in the format {academic year}_{1 or 2}, e.g. 2006_2 is the spring of 2007:',
          default: '2006_1',
        },
        {
          name: 'endTerm',
          type: 'input',
          message:
            'End term in the same format, exclusive (leave empty to continue until end):',
        },
      ]);
      const baseDir = await getFilePath(
        'Enter the path to save the downloaded evaluations in:',
        'data/evaluations/evaluations',
      );
      return fetchOldEvaluations(
        startTerm as TermString,
        endTerm as TermString,
        baseDir,
      );
    },
  },
  {
    label: 'Upload evaluations from a file to firestore',
    async run() {
      const filePath = await getFilePath(
        'File path to evaluations to read from:',
      );
      const evaluations = JSON.parse(readFileSync(filePath).toString('utf8'));
      const { startBatch } = await inquirer.prompt([
        {
          name: 'startBatch',
          type: 'number',
          message: 'Batch to start at:',
          default: 1,
        },
      ]);
      console.log(`uploading ${evaluations.length} total evaluations`);
      const results = await uploadEvaluations(evaluations, startBatch);
      console.log(`wrote ${results.length} results`);
    },
  },
  {
    label: 'Download CS course tags',
    async run() {
      const filePath = await getFilePath('File path to save JSON file to:');
      await fetchCsTags(filePath);
    },
  },
  {
    label: 'Fetch syllabi from Harvard Syllabus Explorer',
    async run() {
      const baseDir = await getFilePath(
        'File path to save syllabi in:',
        'data/syllabi',
      );
      const subjectAbbreviations = Object.keys(subjects).sort();
      const { startIndex, endIndex } = await inquirer.prompt([
        {
          type: 'list',
          name: 'startIndex',
          message: 'Start with subject:',
          choices: subjectAbbreviations,
        },
        {
          type: 'list',
          name: 'endIndex',
          message: 'End with subject (exclusive):',
          choices: ['None', ...subjectAbbreviations],
        },
      ]);
      await fetchSyllabi(
        baseDir,
        subjectAbbreviations.indexOf(startIndex),
        endIndex === 'None' ? undefined : subjectAbbreviations.indexOf(endIndex),
      );
    },
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
