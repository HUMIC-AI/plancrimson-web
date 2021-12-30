const { MeiliSearch } = require('meilisearch');
const inquirer = require('inquirer');
const attributes = require('../shared/meiliAttributes.json');

const client = new MeiliSearch({
  host: 'http://127.0.0.1:7700',
});

const createIndex = () => {
  console.log('remember to set the attributes after');
  return client.createIndex('courses', { primaryKey: 'HU_STRM_CLASSNBR' });
};

const deleteIndex = () => {
  return client.deleteIndexIfExists('courses');
};

const setAttributes = () => {
  return client.index('courses').updateSettings(attributes);
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
  'create "courses" index': createIndex,
  'delete "courses" index': deleteIndex,
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
      console.log('successfully sent request');
      console.log(result);
    }
  } catch (err) {
    console.error(err);
  } finally {
    console.log('done');
  }
}

main();
