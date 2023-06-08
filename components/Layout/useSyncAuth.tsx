import {
  getDoc, onSnapshot, serverTimestamp, setDoc, updateDoc,
} from 'firebase/firestore';
import React, { useEffect } from 'react';
import {
  GoogleAuthProvider, User, getAuth, onAuthStateChanged, signInWithCredential, signInWithRedirect,
} from 'firebase/auth';
import { getAnalytics, setUserId } from 'firebase/analytics';
import { useAppDispatch } from '@/src/utils/hooks';
import { useModal } from '@/src/context/modal';
import {
  Auth, Profile, Schedules, Settings,
} from '@/src/features';
import Firestore from '@/src/schema';
import { extractUsername, getInitialSettings } from '@/src/utils/utils';
import GraduationYearDialog from '@/components/Layout/GraduationYearDialog';
import { getUniqueSemesters } from '@/src/lib';


export async function signInUser() {
  const auth = getAuth();

  if (process.env.NODE_ENV === 'development') {
    const email = prompt('In development mode. Enter email:')!;
    if (!email) throw new Error('no email entered');
    // encode for firebase auth
    const sub = Buffer.from(email).toString('base64');
    const credential = GoogleAuthProvider.credential(JSON.stringify({ sub, email }));
    await signInWithCredential(auth, credential);
  } else {
    // we don't need any additional scopes
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({
      hd: 'college.harvard.edu',
    });
    await signInWithRedirect(auth, provider);
  }
}

/**
 * Sync the Firebase Auth state (i.e. when the user logs in or out) with Redux.
 * Gets called in _app.tsx.
 */
export function useSyncAuth() {
  const auth = getAuth();
  const dispatch = useAppDispatch();
  const { showContents } = useModal();

  // create the listener for the authentication state change
  // updates all of the relevant redux state when the user logs in or out
  useEffect(() => {
    const unsub = onAuthStateChanged(
      auth,
      async (user) => {
        const analytics = getAnalytics();

        if (user === null) {
          console.info('signed out');
          // reset all of the local state
          dispatch(Auth.setAuthInfo(null));
          dispatch(Settings.overwriteSettings(getInitialSettings()));
          dispatch(Profile.signOut());
          dispatch(Schedules.overwriteSchedules([]));
          setUserId(analytics, null);
          return;
        }

        const { uid } = user;
        const email = user.email!;

        dispatch(Auth.setAuthInfo({ uid, email }));
        dispatch(Profile.setPhotoUrl(user.photoURL));
        dispatch(Profile.setUsername(extractUsername(email)));
        setUserId(analytics, uid);

        const profileRef = Firestore.profile(uid);
        const profile = await getDoc(profileRef);

        // if the user doesn't have a profile,
        // prompt them for their graduation year and create one
        if (profile.exists()) {
          // if the user does have a profile, sync it with Redux
          const userProfile = profile.data()!;
          dispatch(Profile.setClassYear(userProfile.classYear!));
        } else {
          const now = new Date();
          showContents({
            title: 'Set graduation year',
            content: <GraduationYearDialog
              defaultYear={now.getFullYear() + (now.getMonth() > 5 ? 4 : 3)}
              handleSubmit={async (classYear) => {
                dispatch(Profile.setClassYear(classYear));
                await handleSubmit(user, classYear);
              }}
            />,
            noExit: true,
          });
        }
      },
      (err) => {
        console.error('error listening for auth state change:', err);
        dispatch(Auth.setSignInError(err));
      },
    );

    return unsub;
  }, []);
}

/**
 * Whenever the user settings are updated in Firestore,
 * sync the change to Redux.
 * Gets called in _app.tsx.
 * Needs to be separate from useSyncAuth because the useEffect
 * needs to return the result of the onSnapshot as a cleanup function.
 */
export function useSyncUserSettings() {
  const dispatch = useAppDispatch();
  const uid = Auth.useAuthProperty('uid');

  useEffect(() => {
    if (!uid) return;

    const userDataRef = Firestore.user(uid);

    // keep the Redux state for the user settings in sync with Firestore
    const unsubUserData = onSnapshot(userDataRef, (snap) => {
      if (!snap.exists()) return;

      const userData = snap.data()!;

      dispatch(Settings.overwriteSettings({
        customTimes: userData.customTimes ?? {},
        chosenSchedules: userData.chosenSchedules ?? {},
        waivedRequirements: userData.waivedRequirements ?? {},
        pairwiseRankings: userData.pairwiseRankings ?? {},
      }));
    }, (err) => {
      console.error(`error listening to ${userDataRef.path}:`, err);
    });

    return unsubUserData;
  }, [uid]);
}

/**
 * When the user submits the graduation year dialog,
 * create the default schedules for the user.
 * Don't save anything to Redux since this will be handled
 * by useSyncUserSettings.
 */
async function handleSubmit(user: User, classYear: number) {
  await setDoc(Firestore.profile(user.uid), {
    username: extractUsername(user.email!),
    displayName: user.displayName,
    photoUrl: user.photoURL,
    classYear,
    bio: '',
    concentrationRanking: [],
  });

  // create the user settings document if it doesn't exist
  const userRef = Firestore.user(user.uid);
  const settings = await getDoc(userRef);
  if (!settings.exists()) {
    await setDoc(Firestore.user(user.uid), getInitialSettings());
  }

  // create the default schedules and choose them for each semester
  const defaultSemesters = getUniqueSemesters(classYear);
  const promises = defaultSemesters.map(async ({ year, season }) => {
    const schedule = Schedules.getDefaultSchedule({ year, season }, user.uid);
    await setDoc(Firestore.schedule(schedule.id), { ...schedule, createdAt: serverTimestamp() });
    return schedule;
  });

  const createdSchedules = await Promise.allSettled(promises);
  const errors = createdSchedules.filter((result) => result.status === 'rejected');
  if (errors.length > 0) {
    console.error('error creating default schedules', errors);
    alert('Error creating default schedules. Please try again later.');
    return;
  }

  // choose the default schedule for each of the user's semesters
  const update: Record<string, string> = {};
  createdSchedules.forEach((schedule) => {
    if (schedule.status === 'fulfilled') { // will certainly be true
      const { year, season, id } = schedule.value;
      update[`chosenSchedules.${year}${season}`] = id;
    }
  });

  await updateDoc(userRef, update as any);
}
