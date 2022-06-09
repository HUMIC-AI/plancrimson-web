import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  RulesTestEnvironment,
} from '@firebase/rules-unit-testing';
import axios from 'axios';
import {
  doc, getDoc, setDoc, setLogLevel,
} from 'firebase/firestore';
import { readFileSync, writeFileSync } from 'fs';

// https://firebase.google.com/docs/firestore/security/test-rules-emulator
// to run:
// firebase emulators:exec --only database "npm run test-database"

let testEnv: RulesTestEnvironment;

beforeAll(async () => {
  setLogLevel('error');

  testEnv = await initializeTestEnvironment({
    firestore: {
      rules: readFileSync(`${__dirname}/../firestore.rules`, 'utf8'),
    },
  });
});

beforeEach(async () => {
  await testEnv.clearFirestore();
});

afterAll(async () => {
  await testEnv.cleanup();

  const coverageFile = 'firestore-coverage.html';
  const { host, port } = testEnv.emulators.firestore!;
  const quotedHost = host.includes(':') ? `[${host}]` : host;
  const { data } = await axios.get(`http://${quotedHost}:${port}/emulator/v1/projects/${testEnv.projectId}:ruleCoverage.html`);
  writeFileSync(coverageFile, data);
  console.log(`view coverage info at ${coverageFile}`);
});

describe('User profiles', () => {
  it('should let me create my profile', async () => {
    const alice = testEnv.authenticatedContext('alice').firestore();
    const bob = testEnv.unauthenticatedContext().firestore();

    await assertSucceeds(setDoc(doc(alice, 'users/alice'), { data: 'hello world' }));
    await assertSucceeds(getDoc(doc(alice, 'users/alice')));
    await assertFails(getDoc(doc(bob, 'users/alice')));
  });
});
