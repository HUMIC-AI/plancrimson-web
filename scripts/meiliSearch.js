const { MeiliSearch } = require('meilisearch');
const inquirer = require('inquirer');
const cheerio = require('cheerio');

const client = new MeiliSearch({
  host: 'http://127.0.0.1:7700',
});

const createIndex = () => {
  return client.createIndex('courses', { primaryKey: 'HU_STRM_CLASSNBR' });
};

const deleteIndex = () => {
  return client.deleteIndexIfExists('courses');
};

const searchableAttributes = [
  'Title', // eg "Abstraction and Design in Computation"
  'SUBJECT', // eg "COMPSCI"
  'CATALOG_NBR', // eg " 51"
  'HU_SBJCT_CATNBR_NL', // eg "COMPSCI51"
  'HU_ALIAS_CATNBR_NS', // eg "CS51"
  'textDescription', // eg "Fundamental concepts in the design of computer programs..."

  'DAY_OF_WEEK', // eg ["Tuesday", "Thursday"]
  'ACAD_CAREER', // eg "FAS"
  'ACAD_ORG', // eg "CS"

  'LOCATION_DESCR_LOCATION', // eg "Allston Campus"
  'SSR_COMPONENTDESCR', // eg "Lecture"
  'HU_REC_PREP', // eg "Strongly recommended: CS 124 (or equivalent)..."
  'HU_COURSE_PREQ', // eg "Enrollment limited to 30 students..."

  'CRSE_ID', // eg "112960"
  'CLASS_NBR', // eg "24111"

  'IS_SCL_DESCR_IS_SCL_DESCRB', // eg "Faculty of Arts & Sciences"
  'IS_SCL_DESCR_IS_SCL_DESCRD', // eg "Computer Science"
  'IS_SCL_DESCR_IS_SCL_DESCRH', // eg "2022 Spring"
  'IS_SCL_DESCR_IS_SCL_DESCRL', // eg ["Stephen Chong", "Brian Yu"]
  'IS_SCL_DESCR_IS_SCL_DESCRJ', // eg "Computer Science"
  'IS_SCL_DESCR_IS_SCL_DESCRG', // eg "SEC 1.402 Classroom"
  'IS_SCL_DESCR100_HU_SCL_GRADE_BASIS', // eg "FAS Letter Graded"
  'IS_SCL_DESCR100_HU_SCL_ATTR_LEVL', // eg "Primarily for Undergraduate Students"
];

const setAttributes = () => {
  return client.index('courses').updateSettings({
    filterableAttributes: [
      'CLASS_NBR',
      'SUBJECT',
      'ACAD_ORG',
      'DAY_OF_WEEK',
      'LOCATION_DESCR_LOCATION',
      'SSR_COMPONENTDESCR',
      'IS_SCL_DESCR100_HU_SCL_ATTR_LEVL',
    ],
    sortableAttributes: ['CATALOG_NBR', 'IS_SCL_STRT_TM_DEC'],
    searchableAttributes,
    displayedAttributes: ['*'], // return all attributes through the api
  });
};

const getAllUpdateStatus = () => {
  return client.index('courses').getAllUpdateStatus();
};

const loadDocuments = async () => {
  const { docPath } = await inquirer.prompt([
    {
      name: 'docPath',
      message: 'Please enter a path to the JSON file',
      type: 'input',
    },
  ]);

  try {
    const docs = require(docPath);
    if (!Array.isArray(docs))
      throw new Error('this file does not contain an array');

    const demoText = JSON.stringify(docs[0], null, 2).slice(0, 100);
    const { confirm } = await inquirer.prompt([
      {
        name: 'confirm',
        message: `is this the file you wish to upload? (first document shown)\n${demoText}`,
        type: 'confirm',
      },
    ]);

    if (confirm) {
      return await client.index('courses').addDocuments(docs);
    } else {
      console.log('nothing changed');
    }
  } catch (err) {
    console.error(err);
    console.error('the error above occurred. nothing done');
  }
};

const createAPIKey = () => {
  return client.getKeys();
};

const methods = {
  'create index': createIndex,
  'delete index': deleteIndex,
  'set attributes': setAttributes,
  'get all updates': getAllUpdateStatus,
  'load documents': loadDocuments,
  'get api keys': createAPIKey,
};

async function main() {
  const { cmd } = await inquirer.prompt([
    {
      name: 'cmd',
      message: 'What would you like to do?',
      type: 'list',
      choices: Object.keys(methods),
    },
  ]);

  try {
    if (cmd in methods) {
      const result = await methods[cmd]();
      console.log('successfully sent request', result);
    }
  } catch (err) {
    console.error(err);
  } finally {
    console.log('done');
  }
}

main();
