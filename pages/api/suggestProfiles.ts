import * as admin from 'firebase-admin';
import type { NextApiRequest, NextApiResponse } from 'next';

if (admin.apps.length === 0) {
  admin.initializeApp();
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // authenticate
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
    console.error("Couldn't verify token:", err);
    res.status(401).send('Unauthenticated');
    return;
  }

  // get all incoming and outgoing friend requests
  const incomingFriends = await getIncomingFriends(uid);
  const outgoingFriends = await getOutgoingFriends(uid);
  const friendIds = [
    ...incomingFriends.docs.map((doc) => doc.data().to),
    ...outgoingFriends.docs.map((doc) => doc.data().from),
  ];

  const schedules = await admin.firestore().collection('schedules').get();
  const mapProfileToClasses: Record<string, string[]> = { [uid]: [] };
  schedules.docs.forEach((schedule) => {
    const owner = schedule.data().ownerUid;
    if (!mapProfileToClasses[owner]) mapProfileToClasses[owner] = [];
    schedule.data().classes.forEach(({ classId }: { classId: string }) => {
      mapProfileToClasses[owner].push(classId);
    });
  });

  // rank profiles according to how many courses they share in common
  const counts: Record<string, number> = {};
  Object.entries(mapProfileToClasses)
    .filter(([id]) => id !== uid && !friendIds.includes(id))
    .forEach(([userId, courses]) => {
      counts[userId] = mapProfileToClasses[uid].filter((id) => courses.includes(id)).length;
    });
  const ranked = Object.entries(counts)
    .sort(([, aCount], [, bCount]) => aCount - bCount);

  res.json(ranked.slice(0, parseInt(req.body.limit, 10) || 12));
}

function getIncomingFriends(uid: string) {
  return admin.firestore().collectionGroup('friends')
    .where('from', '==', uid)
    .where('accepted', '==', true)
    .get();
}

function getOutgoingFriends(uid: string) {
  return admin.firestore().collectionGroup('friends')
    .where('to', '==', uid)
    .where('accepted', '==', true)
    .get();
}
