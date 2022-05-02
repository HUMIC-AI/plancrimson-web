import '../src/wdyr';
import '../src/index.css';
import type { AppProps } from 'next/app';
import { getApps, initializeApp } from 'firebase/app';
import {
  connectFirestoreEmulator, getFirestore, onSnapshot, serverTimestamp, setDoc, updateDoc,
} from 'firebase/firestore';
// import { connectAuthEmulator, getAuth } from 'firebase/auth';
import { Provider } from 'react-redux';
import { useEffect, useState } from 'react';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { SearchStateProvider } from '../src/context/searchState';
import store from '../src/app/store';
import { getUserRef } from '../src/hooks';
import { useAppDispatch, useAppSelector } from '../src/app/hooks';
import * as UserData from '../src/features/userData';
import * as Schedules from '../src/features/schedules';
import { ModalProvider, useModal } from '../src/features/modal';
import { SelectedScheduleProvider } from '../src/context/selectedSchedule';

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: 'AIzaSyAtHudtGRcdGwEuXPnfb8Q4JjcUOYVVcEg',
  authDomain: 'harvard-concentration-planner.firebaseapp.com',
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
    // const auth = getAuth();
    // connectAuthEmulator(auth, 'http://127.0.0.1:9099');
    const db = getFirestore();
    connectFirestoreEmulator(db, '127.0.0.1', 8080);
  }
}

/**
 * Ask the user for their graduation year.
 */
function GraduationYearDialog({ defaultYear } : { defaultYear: number }) {
  const { setOpen } = useModal();
  const [classYear, setYear] = useState(defaultYear);
  const uid = useAppSelector(UserData.selectUserUid)!;
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        updateDoc(getUserRef(uid), 'classYear', classYear)
          .then(() => setOpen(false))
          .catch((err) => console.error(err));
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
  const uid = useAppSelector(UserData.selectUserUid);
  const { showContents } = useModal();

  // When the user logs in/out, dispatch to redux
  useEffect(() => {
    const unsub = onAuthStateChanged(
      auth,
      (u) => dispatch(UserData.signIn(u ? {
        uid: u.uid,
        email: u.email!,
        photoUrl: u.photoURL,
      } : null)),
      (err) => dispatch(UserData.setSignInError(err)),
    );
    return unsub;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!uid) return () => {};

    const userRef = getUserRef(uid);
    const unsub = onSnapshot(
      userRef,
      (userSnap) => {
        // only refresh on new data from Firestore
        if (!userSnap.exists() || userSnap.metadata.fromCache) return;

        const { lastLoggedIn, ...data } = userSnap.data();

        // update last sign in, know this will always exist
        dispatch(UserData.setLastSignIn(lastLoggedIn ? lastLoggedIn.toDate().toISOString() : null));

        // need class year before other missing fields
        if (!data.classYear) {
          console.warn('missing class year');
          const now = new Date();
          showContents({
            title: 'Set graduation year',
            content: <GraduationYearDialog defaultYear={now.getFullYear() + (now.getMonth() > 5 ? 4 : 3)} />,
            noExit: true,
          });
          return;
        }

        dispatch(UserData.setClassYear(data.classYear!));

        // overwrite metadata
        dispatch(Schedules.overwriteScheduleMetadata({
          customTimes: data.customTimes || {},
          selectedSchedules: data.selectedSchedules || {},
          waivedRequirements: data.waivedRequirements || {},
          hiddenScheduleIds: data.hiddenScheduleIds || [],
        }));
      },
      (err) => dispatch(UserData.setSnapshotError(err)),
    );

    // trigger initial write
    setDoc(userRef, { lastLoggedIn: serverTimestamp() }, { merge: true })
      .then(() => console.info('updated last login time'))
      .catch((err) => dispatch(UserData.setSnapshotError(err)));

    return unsub;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uid]);

  return (
    <SearchStateProvider>
      <SelectedScheduleProvider>
        <Component {...pageProps} />
      </SelectedScheduleProvider>
    </SearchStateProvider>
  );
}

function Wrapper(props: AppProps) {
  return (
    <Provider store={store}>
      <ModalProvider>
        <MyApp {...props} />
      </ModalProvider>
    </Provider>
  );
}

export default Wrapper;
