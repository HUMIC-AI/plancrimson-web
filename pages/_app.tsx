// import '../src/wdyr';
import '../src/index.css';
import type { AppProps } from 'next/app';
import { getApps, initializeApp } from 'firebase/app';
import {
  connectFirestoreEmulator, getFirestore, onSnapshot, updateDoc,
} from 'firebase/firestore';
import { connectFunctionsEmulator, getFunctions } from 'firebase/functions';
// import { connectAuthEmulator, getAuth } from 'firebase/auth';
import { Provider } from 'react-redux';
import { useEffect, useState } from 'react';
import { connectAuthEmulator, getAuth, onAuthStateChanged } from 'firebase/auth';
import { SearchStateProvider } from '../src/context/searchState';
import store from '../src/store';
import { useAppDispatch } from '../src/hooks';
import { ModalProvider, useModal } from '../src/context/modal';
import { SelectedScheduleProvider } from '../src/context/selectedSchedule';
import {
  Auth, Profile, Settings,
} from '../src/features';
import { getInitialSettings, Schema } from '../shared/firestoreTypes';

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: 'AIzaSyAtHudtGRcdGwEuXPnfb8Q4JjcUOYVVcEg',
  authDomain: 'plancrimson.com',
  projectId: 'harvard-concentration-planner',
  storageBucket: 'harvard-concentration-planner.appspot.com',
  messagingSenderId: '770496895607',
  appId: '1:770496895607:web:d277088377adf666664472',
  measurementId: 'G-F4RKHQJFH3',
};

// first initialize app
if (getApps().length === 0) {
  initializeApp(firebaseConfig);

  // connect to emulators in development mode
  // check /firebase.json for port numbers
  if (process.env.NODE_ENV === 'development') {
    const auth = getAuth();
    const db = getFirestore();
    const functions = getFunctions();
    connectAuthEmulator(auth, 'http://127.0.0.1:9099');
    connectFirestoreEmulator(db, '127.0.0.1', 8080);
    connectFunctionsEmulator(functions, 'localhost', 5001);
  }
}

/**
 * Ask the user for their graduation year.
 */
function GraduationYearDialog({ defaultYear, uid } : { defaultYear: number; uid: string; }) {
  const { setOpen } = useModal();
  const [classYear, setYear] = useState(defaultYear);
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        updateDoc(Schema.profile(uid), 'classYear', classYear)
          .then(() => setOpen(false))
          .catch((err) => console.error(`error updating class year for ${uid}`, err));
      }}
      className="bg-white p-4"
    >
      <div className="max-w-xs mx-auto flex flex-col items-center space-y-4">
        <h2 className="text-xl font-semibold">What year are you graduating?</h2>
        <input
          type="number"
          name="graduationYear"
          id="graduationYear"
          value={classYear}
          onChange={(e) => setYear(parseInt(e.currentTarget.value, 10))}
          className="border-4 hover:border-black transition-colors w-32 text-center rounded-xl text-3xl p-2"
        />
        <button type="submit" className="interactive px-4 py-2 text-white bg-gray-900 rounded-xl">
          Get started
        </button>
      </div>
    </form>
  );
}

function MyApp({ Component, pageProps }: AppProps) {
  const auth = getAuth();
  const dispatch = useAppDispatch();
  const uid = Auth.useAuthProperty('uid');
  const { showContents } = useModal();

  // When the user logs in/out, dispatch to redux
  useEffect(() => {
    const unsub = onAuthStateChanged(
      auth,
      (u) => {
        console.log('auth state:', u);
        if (u) {
          dispatch(Auth.setAuthInfo({
            uid: u.uid,
            email: u.email!,
          }));
          dispatch(Profile.setPhotoUrl(u.photoURL));
        } else { // just signed out
          dispatch(Auth.setAuthInfo(null));
          dispatch(Settings.overwriteSettings(getInitialSettings()));
        }
      },
      (err) => {
        console.error('error listening for auth state change:', err);
        dispatch(Auth.setSignInError(err));
      },
    );

    return unsub;
  }, []);

  useEffect(() => {
    if (!uid) return;

    console.log('starting profile listener');

    const profileRef = Schema.profile(uid);
    const unsubProfile = onSnapshot(
      profileRef,
      (snap) => {
        if (!snap.exists()) return;

        const { username, classYear } = snap.data();

        // update last sign in, know this will always exist
        if (username) dispatch(Profile.setUsername(username));

        // need class year before other missing fields
        if (!classYear) {
          const now = new Date();
          showContents({
            title: 'Set graduation year',
            content: <GraduationYearDialog defaultYear={now.getFullYear() + (now.getMonth() > 5 ? 4 : 3)} uid={uid} />,
            noExit: true,
          });
        } else {
          dispatch(Profile.setClassYear(classYear));
        }
      },
      (err) => {
        console.error(`error listening to ${profileRef.path}:`, err);
      },
    );

    const userDataRef = Schema.user(uid);
    const unsubUserData = onSnapshot(userDataRef, (snap) => {
      if (!snap.exists() || snap.metadata.fromCache) return;
      const data = snap.data()!;
      dispatch(Settings.overwriteSettings({
        customTimes: data.customTimes || {},
        chosenSchedules: data.chosenSchedules || {},
        waivedRequirements: data.waivedRequirements || {},
      }));
    }, (err) => {
      console.error(`error listening to ${userDataRef.path}:`, err);
    });

    return () => {
      unsubProfile();
      unsubUserData();
    };
  }, [uid]);

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
