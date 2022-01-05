/* eslint-disable no-console */
import { readFileSync } from 'fs';
import { extendClass } from '../server/evaluation';
import { Class } from '../shared/apiTypes';
import { FetchError } from '../shared/fetcher';

async function main() {
  const filepath = process.argv[2];
  if (!filepath) throw new Error('pass path to files to extend');
  const classes = JSON.parse(readFileSync(filepath).toString('utf8'));
  const data = await Promise.all(classes.map(async (cls: Class) => {
    try {
      const extended = await extendClass(cls);
      return extended;
    } catch (err) {
      const { info, message } = err as FetchError;
      console.error(message, info.error);
      return info.data;
    }
  }));
  console.log(JSON.stringify(data));
}

main();
