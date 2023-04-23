import { getDocFromServer, onSnapshot, setDoc } from 'firebase/firestore';
import React, { useEffect } from 'react';
import {
  GoogleAuthProvider, User, getAuth, onAuthStateChanged, signInWithCredential, signInWithPopup,
} from 'firebase/auth';
import { useAppDispatch } from '@/src/utils/hooks';
import { useModal } from '@/src/context/modal';
import {
  Auth, Profile, Schedules, Settings,
} from '@/src/features';
import Firestore from '@/src/schema';
import { extractUsername, getInitialSettings } from '@/src/utils/utils';
import GraduationYearDialog from '@/components/Layout/GraduationYearDialog';
import { getUniqueSemesters } from 'plancrimson-utils';


export async function signInUser() {
  const auth = getAuth();
  let user: User;

  if (process.env.NODE_ENV === 'development') {
    const email = prompt('In development mode. Enter email:')!;
    if (!email) throw new Error('no email entered');
    // encode for firebase auth
    const sub = Buffer.from(email).toString('base64');
    const credential = GoogleAuthProvider.credential(JSON.stringify({ sub, email }));
    const newUser = await signInWithCredential(auth, credential);
    user = newUser.user;
  } else {
    // we don't need any additional scopes
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({
      hd: 'college.harvard.edu',
    });
    const newUser = await signInWithPopup(auth, provider);
    user = newUser.user;
  }

  return user;
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
  useEffect(() => {
    const unsub = onAuthStateChanged(
      auth,
      async (user) => {
        if (user === null) {
          console.info('signed out');
          // reset all of the local state
          dispatch(Auth.setAuthInfo(null));
          dispatch(Settings.overwriteSettings(getInitialSettings()));
          dispatch(Profile.signOut());
          dispatch(Schedules.overwriteSchedules([]));
          return;
        }

        const { uid } = user;
        const email = user.email!;

        dispatch(Auth.setAuthInfo({ uid, email }));
        dispatch(Profile.setPhotoUrl(user.photoURL));

        const profileRef = Firestore.profile(uid);

        // make sure we have live data from Firestore
        const profile = await getDocFromServer(profileRef);

        // if the user doesn't have a profile,
        // prompt them for their graduation year and create one
        if (!profile.exists()) {
          const now = new Date();
          showContents({
            title: 'Set graduation year',
            content: <GraduationYearDialog
              defaultYear={now.getFullYear() + (now.getMonth() > 5 ? 4 : 3)}
              handleSubmit={(classYear) => handleSubmit(dispatch, user, classYear)}
            />,
            noExit: true,
          });
          return;
        }

        // if the user does have a profile, sync it with Redux
        const userProfile = profile.data()!;
        dispatch(Profile.setUsername(userProfile.username!));
        dispatch(Profile.setClassYear(userProfile.classYear!));
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
      }));
    }, (err) => {
      console.error(`error listening to ${userDataRef.path}:`, err);
    });

    return unsubUserData;
  }, [uid]);
}

async function handleSubmit(dispatch: ReturnType<typeof useAppDispatch>, user: User, classYear: number) {
  // create the default schedules and choose them for each semester
  const defaultSemesters = getUniqueSemesters(classYear);
  const promises = defaultSemesters.map(async ({ year, season }) => {
    const { payload: schedule } = await dispatch(
      Schedules.createDefaultSchedule({ year, season }, user.uid),
    );
    await dispatch(
      Settings.chooseSchedule({
        term: `${schedule.year}${schedule.season}`,
        scheduleId: schedule.id,
      }),
    );
  });
  const settled = await Promise.allSettled(promises);

  const errors = settled.filter((result) => result.status === 'rejected');
  if (errors.length > 0) {
    console.error('error creating default schedules', errors);
    alert('Error creating default schedules. Please try again later.');
  }

  await setDoc(Firestore.profile(user.uid), {
    username: extractUsername(user.email!),
    displayName: user.displayName,
    photoUrl: user.photoURL,
    classYear,
    bio: '',
    concentrationRanking: [],
  });

  await setDoc(Firestore.user(user.uid), getInitialSettings(), { merge: true });
}
