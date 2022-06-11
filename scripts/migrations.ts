import { getAuth, UserRecord } from 'firebase-admin/auth';
import { BulkWriter, FieldValue, getFirestore } from 'firebase-admin/firestore';

async function migrateUser(user: UserRecord, writer: BulkWriter) {
  const db = getFirestore();

  const userDocument = await db.doc(`users/${user.uid}`).get();
  const profileDoc = db.doc(`profiles/${user.uid}`);

  const promises: Array<Promise<unknown>> = [];
  if (userDocument.exists) {
    const data = userDocument.data()!;
    Object.values(data.schedules).forEach((schedule: any) => {
      const newDoc = db.collection('schedules').doc();
      promises.push(writer.set(newDoc, {
        id: newDoc.id,
        title: schedule.id,
        ownerUid: user.uid,
        public: false,
        classes: schedule.classes,
        year: schedule.year,
        season: schedule.season,
      }));
    });

    // remove fields from the current user document
    promises.push(writer.update(userDocument.ref, {
      classYear: FieldValue.delete(),
      schedules: FieldValue.delete(),
    }));

    // move them into the profile document
    promises.push(writer.set(profileDoc, {
      username: user.displayName,
      photoUrl: user.photoURL,
      classYear: data.classYear,
    }, { merge: true }));
  } else {
    promises.push(writer.set(profileDoc, { photoUrl: user.photoURL }, { merge: true }));
  }
  return promises;
}

export default async function migration20220610() {
  const db = getFirestore();
  const auth = getAuth();
  let token: string | undefined;
  while (true) {
    const users = await auth.listUsers(500, token);
    const writer = db.bulkWriter();

    users.users.map((user) => migrateUser(user, writer));

    if (users.pageToken) token = users.pageToken;
    else break;
  }
}
