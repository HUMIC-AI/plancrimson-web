import '../server/initFirebase';
import { getAuth, UserRecord } from 'firebase-admin/auth';
import { BulkWriter, FieldValue, getFirestore } from 'firebase-admin/firestore';
import { v4 as uuidv4 } from 'uuid';

// returns a list of promises for the bulkWriter.
// should be idempotent -- running this multiple times will be a no-op
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
        title: schedule.id || null,
        ownerUid: user.uid,
        public: false,
        classes: schedule.classes || [],
        year: schedule.year || null,
        season: schedule.season || null,
      });
    });

    // remove fields from the current user document
    writer.update(userDocument.ref, {
      chosenSchedules: data.selectedSchedules || {},
      selectedSchedules: FieldValue.delete(),
      classYear: FieldValue.delete(),
      schedules: FieldValue.delete(),
    });

    // move them into the profile document
    writer.set(profileDoc, {
      username,
      displayName: user.displayName || username,
      bio: '',
      photoUrl: user.photoURL || null,
      classYear: data.classYear || null,
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
      displayName: user.displayName || username,
      bio: '',
      photoUrl: user.photoURL || null,
      concentrationRanking: [],
    }, { merge: true });
  }
}

export default async function migration20220610() {
  const db = getFirestore();
  const user = await db.doc('users/IrssSW45bNYQTQBkPAS4M2PJNvm1').get();
  const entries = await Promise.all(Object.entries(user.data()!.selectedSchedules).map(async ([term, title]) => {
    const schedule = await db.collection('schedules').where('ownerUid', '==', 'IrssSW45bNYQTQBkPAS4M2PJNvm1').where('title', '==', title).get();
    return [term, schedule.docs[0].id];
  }));
  await user.ref.update({
    selectedSchedules: FieldValue.delete(),
    chosenSchedules: Object.fromEntries(entries),
  });

  if (false) {
    const db = getFirestore();
    const users = await db.collection('users').where('chosenSchedules', '!=', null).get();
    const promises = users.docs.map(async (user) => {
      const promises = Object.entries(user.data().chosenSchedules).map(async ([term, scheduleTitle]) => {
        const schedules = await db.collection('schedules').where('ownerUid', '==', user.id).where('title', '==', scheduleTitle).get();
        if (schedules.size !== 1) {
          const err = new Error(`failed ${user.id} ${term} ${scheduleTitle}`);
          console.error(err);
          throw err;
        }
        return [term, schedules.docs[0].id];
      });
      const entries = await Promise.allSettled(promises);
      const chosenSchedules = Object.fromEntries(entries.map((result) => result.status === 'fulfilled' && result.value).filter(Boolean) as [string, any][]);
      await user.ref.update({ chosenSchedules });
    });
    await Promise.all(promises);
  }

  if (false) {
    const db = getFirestore();
    const users = await db.collection('users').where('schedules', '!=', null).get();
    console.log(users.docs.map((snap) => snap.id));
    users.docs.map(async (user) => {
      await Promise.all(Object.values(user.data().schedules).map(async (schedule: any) => {
        const ref = db.doc(`schedules/${uuidv4()}`);
        await ref.set({
          id: ref.id,
          title: schedule.id || null,
          ownerUid: user.id,
          public: false,
          classes: schedule.classes || [],
          year: schedule.year || null,
          season: schedule.season || null,
        });
      }));
      await user.ref.update({ schedules: FieldValue.delete() });
    });
  }

  if (false) {
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
}
