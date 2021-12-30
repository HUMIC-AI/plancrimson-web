import { initializeApp, applicationDefault } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

async function main() {
  if (process.argv.length < 3) {
    throw new Error('pass the email or uid to make admin');
  }
  initializeApp({
    credential: applicationDefault(),
  });

  const auth = getAuth();
  const claims = {
    admin: true,
  };
  try {
    const user = await auth.getUser(process.argv[2]);
    auth.setCustomUserClaims(user.uid, claims);
  } catch (err) {
    const user = await auth.getUserByEmail(process.argv[2]);
    getAuth().setCustomUserClaims(user.uid, claims);
  }
}

main();
