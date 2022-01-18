import axios, { AxiosRequestHeaders } from 'axios';
import inquirer from 'inquirer';
import path from 'path/posix';
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

export default async function uploadData(data: ExtendedClass[]) {
  const { meiliUrl } = await inquirer.prompt([
    {
      type: 'input',
      name: 'meiliUrl',
      message: 'URL of the MeiliSearch database:',
      default: defaultMeiliUrl,
    },
  ]);

  axios({
    url: path.join(meiliUrl, 'indexes/courses/documents'),
    headers: getHeaders(meiliUrl),
    data,
  });
}
