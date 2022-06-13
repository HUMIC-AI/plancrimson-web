import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

admin.initializeApp();

export const suggestProfiles = functions.https.onCall(async (data, context) => {
  const uid = context.auth?.uid;
  if (!uid) {
    throw new functions.https.HttpsError("unauthenticated", "Unauthenticated");
  }

  const schedules = await admin.firestore().collection("schedules").get();
  const profiles: Record<string, string[]> = {[uid]: []};
  schedules.docs.forEach((schedule) => {
    const owner = schedule.data().ownerUid;
    if (!profiles[owner]) profiles[owner] = [];
    schedule.data().classes.forEach(({classId}: { classId: string }) => {
      profiles[owner].push(classId);
    });
  });

  const counts: Record<string, number> = {};
  Object.entries(profiles).forEach(([userId, courses]) => {
    counts[userId] = profiles[uid].filter((id) => courses.includes(id)).length;
  });
  const ranked = Object.entries(counts)
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      .sort(([a, aCount], [b, bCount]) => aCount - bCount);

  return ranked.slice(0, 10);
});
