// import '../src/wdyr';
import '../src/index.css';
import type { AppProps } from 'next/app';
import { getApps, initializeApp } from 'firebase/app';
import {
  connectFirestoreEmulator, getDocFromServer, getFirestore, onSnapshot,
} from 'firebase/firestore';
import { Provider } from 'react-redux';
import React, { useEffect } from 'react';
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
import { getInitialSettings } from '../shared/util';
import GraduationYearDialog from '../components/GraduationYearDialog';

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

function MyApp({ Component, pageProps }: AppProps) {
  const auth = getAuth();
  const dispatch = useAppDispatch();

  // When the user logs in/out, dispatch to redux
  useEffect(() => {
    const unsub = onAuthStateChanged(
      auth,
      (u) => {
        if (u) {
          dispatch(Auth.setAuthInfo({
            uid: u.uid,
            email: u.email!,
          }));
          dispatch(Profile.setPhotoUrl(u.photoURL));
        } else { // just signed out
          console.log('signed out');
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

/**
 * Syncs the user's profile data in Firestore to Redux.
 */
function useProfile() {
  const dispatch = useAppDispatch();
  const uid = Auth.useAuthProperty('uid');
  const { showContents } = useModal();

  useEffect(() => {
    if (!uid) return;

    // check if the Firebase document for the user's profile exists.
    // if so, sync it to Redux. Force using latest version
    (async () => {
      const profile = await getDocFromServer(Schema.profile(uid));

      if (!profile.exists()) return;
      const data = profile.data()!;
      if (data.username) {
        dispatch(Profile.setUsername(data.username));
      }

      // show the graduation dialog if they haven't filled it in yet
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

    // keep the Redux state for the user settings in sync with Firestore
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
