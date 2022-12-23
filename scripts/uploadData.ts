import axios from 'axios';
import {
  existsSync, readdirSync, readFileSync, statSync,
} from 'fs';
import inquirer from 'inquirer';
import { ExtendedClass } from '../shared/apiTypes';
// import { assertEnvVar } from './util';

const defaultMeiliUrl = 'http://127.0.0.1:7700';

function getHeaders(meiliRequired: boolean) {
  if (!meiliRequired) {
    return {
      'Content-Type': 'application/json',
    };
  }

  const meiliPrivate = process.env.MEILI_PRIVATE;

  if (!meiliPrivate) {
    return {
      'Content-Type': 'application/json',
    };
  }

  return {
    'X-Meili-API-Key': meiliPrivate,
    'Content-Type': 'application/json',
  };
}

/**
 * Uploads data to MeiliSearch
 * @param url the url of the MeiliSearch instance
 * @param data the data to upload
 */
async function uploadData(url: string, data: ExtendedClass[]) {
  try {
    await axios({
      method: 'POST',
      url: `${url}/indexes/courses/documents`,
      headers: getHeaders(!!url),
      data,
    });
  } catch (err) {
    console.error(`error uploading ${data.length} courses:`, err);
  }
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

    const { meiliUrl } = await inquirer.prompt([
      {
        type: 'input',
        name: 'meiliUrl',
        message: 'URL of the MeiliSearch database:',
        default: defaultMeiliUrl,
      },
    ]);

    await getAllCourses(filepath, meiliUrl);
  },
};

async function getAllCourses(filepath: string, meiliUrl: string): Promise<void> {
  if (statSync(filepath).isDirectory()) {
    const files = readdirSync(filepath);
    const promises = files.map((file) => getAllCourses(`${filepath}/${file}`, meiliUrl));
    await Promise.all(promises);
  } else {
    const data = readFileSync(filepath).toString('utf8');
    const allCourses: ExtendedClass[] = JSON.parse(data);

    for (let i = 0; i < allCourses.length; i += 500) {
      console.log(`uploading from index ${i}`);
      await uploadData(meiliUrl, allCourses.slice(i, i + 500));
    }
  }
}

// data/courses/courses-2022-02-01