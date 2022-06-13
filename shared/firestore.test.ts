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
import { writeFileSync } from 'fs';
import { signInUser } from '../src/hooks';

// https://firebase.google.com/docs/firestore/security/test-rules-emulator

let testEnv: RulesTestEnvironment;

beforeAll(async () => {
  setLogLevel('error');

  testEnv = await initializeTestEnvironment({ projectId: 'demo-test' });
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
  it('should create a profile document and a user document when signing in', async () => {
    const user = await signInUser();
    expect(user).toBeDefined();
    expect(user!.email).toBe('alice@college.harvard.edu');
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      const db = ctx.firestore();
      await assertSucceeds(getDoc(doc(db, `users/${user!.uid}`)));
      await assertSucceeds(getDoc(doc(db, `profiles/${user!.uid}`)));
    });
  });

  it('should let me create my profile', async () => {
    const alice = testEnv.authenticatedContext('alice', { email: 'alice@college.harvard.edu' }).firestore();
    const bob = testEnv.unauthenticatedContext().firestore();

    await assertSucceeds(setDoc(doc(alice, 'users/alice'), { data: 'hello world' }));
    await assertSucceeds(getDoc(doc(alice, 'users/alice')));
    await assertFails(getDoc(doc(bob, 'users/alice')));
  });
});
