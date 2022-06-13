import '../server/initFirebase';
import { getAuth, UserRecord } from 'firebase-admin/auth';
import { BulkWriter, FieldValue, getFirestore } from 'firebase-admin/firestore';
import { v4 as uuidv4 } from 'uuid';

// returns a list of promises for the bulkWriter.
async function migrateUser(user: UserRecord, writer: BulkWriter) {
  const db = getFirestore();

  const userDocument = await db.doc(`users/${user.uid}`).get();
  const profileDoc = db.doc(`profiles/${user.uid}`);

  const username = user.email!.slice(0, user.email!.lastIndexOf('@'));
  if (userDocument.exists) {
    const data = userDocument.data()!;

    Object.values(data.schedules).forEach((schedule: any) => {
      const newDoc = db.doc(`schedules/${uuidv4()}`);
      writer.set(newDoc, {
        id: newDoc.id,
        title: schedule.id,
        ownerUid: user.uid,
        public: false,
        classes: schedule.classes,
        year: schedule.year,
        season: schedule.season,
      });
    });

    // remove fields from the current user document
    writer.update(userDocument.ref, {
      chosenSchedules: data.selectedSchedules,
      selectedSchedules: FieldValue.delete(),
      classYear: FieldValue.delete(),
      schedules: FieldValue.delete(),
    });

    // move them into the profile document
    writer.set(profileDoc, {
      username,
      displayName: user.displayName,
      bio: '',
      photoUrl: user.photoURL,
      classYear: data.classYear,
      concentrationRanking: [],
    }, { merge: true });
  } else { // no user document
    writer.set(userDocument.ref, {
      chosenSchedules: {},
      customTimes: {},
      waivedRequirements: {},
    });

    writer.set(profileDoc, {
      username,
      displayName: user.displayName,
      bio: '',
      photoUrl: user.photoURL,
      concentrationRanking: [],
    }, { merge: true });
  }
}

export default async function migration20220610() {
  const db = getFirestore();
  const auth = getAuth();
  let token: string | undefined;
  const writer = db.bulkWriter();
  writer.onWriteError((err) => {
    console.error('error writing files, retrying:', err);
    return true;
  });
  writer.onWriteResult((ref) => {
    console.log(`successfully written to ${ref.path}`);
  });

  while (true) {
    const users = await auth.listUsers(500, token);

    console.log('loading', users.users.length, 'users');

    await Promise.all(users.users.map((user) => migrateUser(user, writer)));
    await writer.flush();

    if (users.pageToken) token = users.pageToken;
    else break;
  }
}
