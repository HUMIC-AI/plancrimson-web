import { getApps, initializeApp, applicationDefault } from 'firebase-admin/app';

if (getApps().length === 0) {
  initializeApp({
    credential: applicationDefault(),
  });
}
