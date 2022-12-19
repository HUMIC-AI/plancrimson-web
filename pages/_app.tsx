// import '../src/wdyr';
import '../src/index.css';
import type { AppProps } from 'next/app';
import { getApps, initializeApp } from 'firebase/app';
import {
  connectFirestoreEmulator, getDoc, getFirestore, onSnapshot, updateDoc,
} from 'firebase/firestore';
import { Provider } from 'react-redux';
import React, { useEffect, useState } from 'react';
import { connectAuthEmulator, getAuth, onAuthStateChanged } from 'firebase/auth';
import { SearchStateProvider } from '../src/context/searchState';
import store from '../src/store';
import { useAppDispatch } from '../src/hooks';
import { ModalProvider, useModal } from '../src/context/modal';
import { SelectedScheduleProvider } from '../src/context/selectedSchedule';
import {
  Auth, Profile, Schedules, Settings,
} from '../src/features';
import Schema from '../shared/schema';
import { getInitialSettings, getUniqueSemesters } from '../shared/util';

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: 'AIzaSyAtHudtGRcdGwEuXPnfb8Q4JjcUOYVVcEg',
  // authDomain: 'plancrimson.com',
  authDomain: 'harvard-concentration-planner.web.app',
  projectId: 'harvard-concentration-planner',
  storageBucket: 'harvard-concentration-planner.appspot.com',
  messagingSenderId: '770496895607',
  appId: '1:770496895607:web:d277088377adf666664472',
  measurementId: 'G-F4RKHQJFH3',
};

if (getApps().length === 0) {
  initializeApp(firebaseConfig);

  // connect to emulators in development mode
  // check /firebase.json for port numbers
  if (process.env.NODE_ENV === 'development') {
    const auth = getAuth();
    const db = getFirestore();
    connectAuthEmulator(auth, 'http://127.0.0.1:9099');
    connectFirestoreEmulator(db, '127.0.0.1', 8080);
  }
}

/**
 * Ask the user for their graduation year.
 * Create default schedules
 */
function GraduationYearDialog({ defaultYear, uid } : { defaultYear: number; uid: string; }) {
  const dispatch = useAppDispatch();
  const { setOpen } = useModal();
  const [classYear, setYear] = useState(defaultYear);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const promises = getUniqueSemesters(classYear).map(async ({ year, season }) => {
      const { payload: schedule } = await dispatch(Schedules.createDefaultSchedule({ year, season }, uid));
      await dispatch(Settings.chooseSchedule({ term: `${schedule.year}${schedule.season}`, scheduleId: schedule.id }));
    });
    const settled = await Promise.allSettled(promises);
    console.log(settled);
    settled.forEach((result) => {
      if (result.status === 'rejected') {
        console.error('error creating default schedules', result.reason);
      }
    });

    await updateDoc(Schema.profile(uid), 'classYear', classYear).catch((err) => console.error(`error updating class year for ${uid}`, err));

    setOpen(false);
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white p-4"
    >
      <div className="mx-auto flex max-w-xs flex-col items-center space-y-4">
        <h2 className="text-xl font-semibold">What year are you graduating?</h2>
        <input
          type="number"
          name="graduationYear"
          id="graduationYear"
          value={classYear}
          onChange={(e) => setYear(parseInt(e.currentTarget.value, 10))}
          className="w-32 rounded-xl border-4 p-2 text-center text-3xl transition-colors hover:border-black"
        />
        <button type="submit" className="interactive rounded-xl bg-gray-900 px-4 py-2 text-white">
          Get started
        </button>
      </div>
    </form>
  );
}

function MyApp({ Component, pageProps }: AppProps) {
  const auth = getAuth();
  const dispatch = useAppDispatch();

  // When the user logs in/out, dispatch to redux
  useEffect(() => {
    const unsub = onAuthStateChanged(
      auth,
      async (u) => {
        if (u) {
          dispatch(Auth.setAuthInfo({
            uid: u.uid,
            email: u.email!,
          }));
          dispatch(Profile.setPhotoUrl(u.photoURL));
        } else { // just signed out
          dispatch(Auth.setAuthInfo(null));
          dispatch(Settings.overwriteSettings(getInitialSettings()));
          dispatch(Profile.signOut());
          dispatch(Schedules.overwriteSchedules([]));
        }
      },
      (err) => {
        console.error('error listening for auth state change:', err);
        dispatch(Auth.setSignInError(err));
      },
    );

    return unsub;
  }, []);

  useProfile();

  return (
    <SearchStateProvider>
      <SelectedScheduleProvider>
        {/* @ts-ignore */}
        <Component {...pageProps} />
      </SelectedScheduleProvider>
    </SearchStateProvider>
  );
}

export default function Wrapper(props: AppProps) {
  return (
    <Provider store={store}>
      <ModalProvider>
        <MyApp {...props} />
      </ModalProvider>
    </Provider>
  );
}

function useProfile() {
  const dispatch = useAppDispatch();
  const uid = Auth.useAuthProperty('uid');
  const { showContents } = useModal();

  useEffect(() => {
    if (!uid) return;

    // check if the profile exists
    (async () => {
      const profile = await getDoc(Schema.profile(uid));

      if (!profile.exists()) return;
      const data = profile.data()!;
      if (data.username) dispatch(Profile.setUsername(data.username));

      if (!data.classYear) {
        const now = new Date();
        showContents({
          title: 'Set graduation year',
          content: <GraduationYearDialog defaultYear={now.getFullYear() + (now.getMonth() > 5 ? 4 : 3)} uid={uid} />,
          noExit: true,
        });
      } else {
        dispatch(Profile.setClassYear(data.classYear));
      }
    })();

    const userDataRef = Schema.user(uid);
    const unsubUserData = onSnapshot(userDataRef, (snap) => {
      if (!snap.exists()) return;

      const data = snap.data()!;
      dispatch(Settings.overwriteSettings({
        customTimes: data.customTimes || {},
        chosenSchedules: data.chosenSchedules || {},
        waivedRequirements: data.waivedRequirements || {},
      }));
    }, (err) => {
      console.error(`error listening to ${userDataRef.path}:`, err);
    });

    return unsubUserData;
  }, [uid]);
}
