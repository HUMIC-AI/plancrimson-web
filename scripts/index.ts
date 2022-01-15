/* eslint-disable no-console */
import axios from 'axios';
import { existsSync, readFileSync } from 'fs';
import inquirer from 'inquirer';
import downloadData from './downloadData';
import uploadData from './uploadData';

const commands = [
  {
    label: 'Download course data from my.harvard',
    run: downloadData,
  },
  {
    label: 'Download the SEAS Four Year Plan course data',
    async run() {
      const { data } = await axios.get('https://info.seas.harvard.edu/courses/api/schedule/courses');
      console.log(data);
    },
  },
  {
    label: 'Download the SEAS Four Year Plan public data',
    async run() {
      const { data } = await axios.get('https://info.seas.harvard.edu/courses/api/courses/public');
      console.log(data);
    },
  },
  {
    label: 'Upload course data from a file to MeiliSearch',
    async run() {
      const { filepath } = await inquirer.prompt([{
        name: 'filepath',
        message: 'Which file would you like to upload to MeiliSearch?',
        type: 'input',
      }]);
      if (!existsSync(filepath)) {
        throw new Error('file does not exist');
      }
      await uploadData(JSON.parse(readFileSync(filepath).toString('utf8')));
    },
  },
];

async function main() {
  const { command } = await inquirer.prompt([{
    name: 'command',
    message: 'What would you like to do?',
    type: 'list',
    choices: commands.map((cmd) => cmd.label),
  }]);

  try {
    await commands.find((c) => c.label === command)!.run();
  } catch (err) {
    console.error(err);
  }
}

main().catch((err) => console.error(err));
