/* eslint-disable no-console */
import '../server/initFirebase';
import { getAuth } from 'firebase-admin/auth';

export default async function authorizeUser(emailOrUid: string) {
  const auth = getAuth();
  const claims = {
    admin: true,
  };
  try {
    const user = await auth.getUser(emailOrUid);
    auth.setCustomUserClaims(user.uid, claims);
    console.log(`successfully set ${user.uid} claims to ${claims}`);
  } catch (err) {
    const user = await auth.getUserByEmail(emailOrUid);
    getAuth().setCustomUserClaims(user.uid, claims);
    console.log(`successfully set ${user.uid} claims to ${claims}`);
  }
}
