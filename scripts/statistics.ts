import { getFirestore } from 'firebase-admin/firestore';
import { writeFileSync } from 'fs';

async function fetchStatistics() {
  const db = getFirestore();

  const users = await db.collection('users').get();
  const allUserData = users.docs.map((doc) => doc.data());
  writeFileSync('userData.json', JSON.stringify(allUserData));
  return users;
}

export default {
  label: 'Fetch user data from Firestore',
  async run() {
    await fetchStatistics();
  },
};
