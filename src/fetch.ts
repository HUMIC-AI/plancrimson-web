/* eslint-disable no-await-in-loop */
/* eslint-disable max-len */
import axios from 'axios';
import qs from 'qs';
import { Course, MyHarvardResponse } from './types';

async function runAction() {
  const data = await fetchCourses({ SearchText: '( (PARENT_NODE_NAME:SEAS) ) (  )' });
  const keys = new Set();
  data[0].ResultsCollection.forEach((course) => Object.keys(course).forEach((key) => keys.add(key)));
  const { selectFields } = await inquirer.prompt({ name: 'selectFields', type: 'confirm', message: 'Only select certain fields?' });

  if (selectFields) {
    const { fields } = await inquirer.prompt([{
      name: 'fields',
      message: 'Select from the following fields:',
      type: 'checkbox',
      choices: [...keys].sort().map((key) => ({ name: key })),
    }]);

    return data[0].ResultsCollection.map((obj) => {
      const ret = {} as any;
      fields.forEach((field: keyof Course) => {
        ret[field] = obj[field];
      });
      return ret;
    });
  }
  console.log(data[0].ResultsCollection.map((course) => ({
    number: course.HU_ALIAS_CATNBR_NL,
    name: course.IS_SCL_DESCR100,
    description: course.IS_SCL_DESCR,
    term: course.IS_SCL_DESCR_IS_SCL_DESCRH,
    instructor: course.IS_SCL_DESCR_IS_SCL_DESCRL,
  })));

  return false;
}
