import * as admin from 'firebase-admin';
import type { NextApiRequest, NextApiResponse } from 'next';

if (admin.apps.length === 0) {
  admin.initializeApp();
}

// eslint-disable-next-line max-len
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const auth = req.headers.authorization;
  if (!auth?.startsWith('Bearer ')) {
    res.status(401).send('Unauthenticated');
    return;
  }
  let uid: string;
  try {
    const token = await admin.auth().verifyIdToken(auth.slice('Bearer '.length));
    uid = token.uid;
  } catch (err) {
    res.status(401).send('Unauthenticated');
    return;
  }

  const incomingFriends = await admin.firestore().collectionGroup('friends')
    .where('from', '==', uid)
    .where('accepted', '==', true)
    .get();
  const outgoingFriends = await admin.firestore().collectionGroup('friends')
    .where('to', '==', uid)
    .where('accepted', '==', true)
    .get();
  const friendIds = [
    ...incomingFriends.docs.map((doc) => doc.data().to),
    ...outgoingFriends.docs.map((doc) => doc.data().from),
  ];

  const schedules = await admin.firestore().collection('schedules').get();
  const profiles: Record<string, string[]> = { [uid]: [] };
  schedules.docs.forEach((schedule) => {
    const owner = schedule.data().ownerUid;
    if (!profiles[owner]) profiles[owner] = [];
    schedule.data().classes.forEach(({ classId }: { classId: string }) => {
      profiles[owner].push(classId);
    });
  });

  const counts: Record<string, number> = {};
  Object.entries(profiles)
    .filter(([id]) => id !== uid && !friendIds.includes(id))
    .forEach(([userId, courses]) => {
      counts[userId] = profiles[uid].filter((id) => courses.includes(id)).length;
    });
  const ranked = Object.entries(counts)
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    .sort(([a, aCount], [b, bCount]) => aCount - bCount);

  res.json(ranked.slice(0, parseInt(req.body.limit, 10) || 12));
}
