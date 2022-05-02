import axios, { AxiosRequestHeaders } from 'axios';
import { existsSync, readFileSync } from 'fs';
import inquirer from 'inquirer';
import { ExtendedClass } from '../shared/apiTypes';

const defaultMeiliUrl = 'http://127.0.0.1:7700';

function getHeaders(meiliRequired: boolean): AxiosRequestHeaders {
  if (!meiliRequired) {
    return {
      'Content-Type': 'application/json',
    };
  }

  const MEILI_PRIVATE = process.env.MEILI_PRIVATE!;
  if (!MEILI_PRIVATE) {
    throw new Error('must set MEILI_PRIVATE env variable');
  }
  return {
    'X-Meili-API-Key': MEILI_PRIVATE,
    'Content-Type': 'application/json',
  };
}

async function uploadData(data: ExtendedClass[]) {
  const { meiliUrl } = await inquirer.prompt([
    {
      type: 'input',
      name: 'meiliUrl',
      message: 'URL of the MeiliSearch database:',
      default: defaultMeiliUrl,
    },
  ]);

  await axios({
    url: `${meiliUrl}/indexes/courses/documents`,
    headers: getHeaders(meiliUrl),
    data,
  });
}

export default {
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
    const allCourses: ExtendedClass[] = JSON.parse(readFileSync(filepath).toString('utf8'));
    for (let i = 0; i < allCourses.length; i += 500) {
      // eslint-disable-next-line no-await-in-loop
      await uploadData(allCourses.slice(i, i + 500));
    }
  },
};

// data/courses/courses-2022-02-01
