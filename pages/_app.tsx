import '../src/wdyr';
import '../src/index.css';
import type { AppProps } from 'next/app';
import { getApps, initializeApp } from 'firebase/app';
import {
  connectFirestoreEmulator, getFirestore, onSnapshot, serverTimestamp, setDoc, Timestamp, updateDoc,
} from 'firebase/firestore';
// import { connectAuthEmulator, getAuth } from 'firebase/auth';
import { Provider } from 'react-redux';
import { useEffect, useState } from 'react';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { SearchStateProvider } from '../src/context/searchState';
import store from '../src/app/store';
import { getUserRef } from '../src/hooks';
import { useAppDispatch, useAppSelector } from '../src/app/hooks';
import {
  selectUid, setClassYear, setLastSignIn, setSnapshotError, signIn, signInError,
} from '../src/features/userData';
import { overwrite } from '../src/features/schedules';
import { ModalProvider, useModal } from '../src/features/modal';
import { allTruthy, getDefaultSemesters, getUniqueSemesters } from '../shared/util';
import type { Term, UserDocument } from '../shared/firestoreTypes';
import { loadClass } from '../src/features/classCache';
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

function GraduationYearDialog({ defaultYear } : { defaultYear: number }) {
  const { setOpen } = useModal();
  const [classYear, setYear] = useState(defaultYear);
  const uid = useAppSelector(selectUid)!;
  return (
    <form onSubmit={(e) => {
      e.preventDefault();
      updateDoc(getUserRef(uid), 'classYear', classYear)
        .then(() => setOpen(false))
        .catch((err) => console.error(err));
    }}
    >
      <h2>What year are you graduating?</h2>
      <input
        type="number"
        name="graduationYear"
        id="graduationYear"
        value={classYear}
        onChange={(e) => setYear(parseInt(e.currentTarget.value, 10))}
      />
      <input type="submit" value="Submit" />
    </form>
  );
}

function getMissingFields({
  classYear, schedules, customTimes, selectedSchedules, waivedRequirements,
}: Partial<UserDocument<Timestamp>>) {
  // need the class year to do anything else
  if (!classYear) {
    const now = new Date();
    const defaultYear = now.getFullYear() + (now.getMonth() > 5 ? 4 : 3);
    return { classYear: defaultYear };
  }

  const missingFields: Partial<UserDocument<Timestamp>> = {};

  if (!schedules) {
    missingFields.schedules = Object.fromEntries(getDefaultSemesters(classYear).map(({ year, season }) => {
      const id = `${season} ${year}`;
      return [id, {
        year, season, id, classes: [],
      }];
    }));
  }

  // for each term that does not currently have a selected schedule,
  // select the first schedule
  const existingSchedules = Object.values(schedules || missingFields.schedules!);
  if (!selectedSchedules) {
    missingFields.selectedSchedules = Object.fromEntries(allTruthy(getUniqueSemesters(classYear, existingSchedules).map(({ year, season }) => {
      const term: Term = `${year}${season}`;
      const existing = existingSchedules.find(
        ({ year: y, season: s }) => year === y && season === s,
      );
      if (!existing) return null;
      return [term, existing.id];
    })));
  } else {
    const missingSelectedSchedules = allTruthy(getUniqueSemesters(classYear, existingSchedules).map(({ year, season }) => {
      const term: Term = `${year}${season}`;
      const existing = existingSchedules.find(
        ({ year: y, season: s }) => year === y && season === s,
      );
      if (selectedSchedules[term] || !existing) return null;
      return [term, existing.id];
    }));
    if (missingSelectedSchedules.length > 0) {
      missingFields.selectedSchedules = Object.assign(selectedSchedules, Object.fromEntries(missingSelectedSchedules));
    }
  }

  if (!customTimes) {
    missingFields.customTimes = {};
  }

  if (!waivedRequirements) {
    missingFields.waivedRequirements = {};
  }

  return missingFields;
}

const MyApp = function ({ Component, pageProps }: AppProps) {
  const auth = getAuth();
  const dispatch = useAppDispatch();
  const uid = useAppSelector(selectUid);
  const { showContents } = useModal();

  // load user
  useEffect(() => {
    const unsub = onAuthStateChanged(
      auth,
      (u) => dispatch(signIn(u ? {
        uid: u.uid,
        email: u.email!,
        photoUrl: u.photoURL,
      } : null)),
      (err) => dispatch(signInError(err)),
    );
    return unsub;
  }, []);

  useEffect(() => {
    if (!uid) return () => {};

    const ref = getUserRef(uid);
    const unsub = onSnapshot(
      ref,
      (snap) => {
        if (!snap.exists() || snap.metadata.fromCache) return;

        const { lastLoggedIn, ...data } = snap.data();

        // know this will always exist
        dispatch(setLastSignIn(lastLoggedIn ? lastLoggedIn.toDate().toISOString() : null));

        const missing = getMissingFields(data);

        // need class year before other missing fields
        if (missing.classYear) {
          console.warn('missing class year');
          showContents({
            title: 'Set graduation year',
            content: <GraduationYearDialog defaultYear={missing.classYear} />,
          });
          return;
        }

        // otherwise, handle other missing fields
        if (Object.keys(missing).length > 0) {
          setDoc(ref, missing, { merge: true })
            .catch((err) => console.error(err));
          return;
        }

        dispatch(setClassYear(data.classYear!));

        Object.values(data.schedules!)
          .forEach((schedule) => schedule.classes
            .forEach(({ classId }) => dispatch(loadClass(classId))));

        dispatch(overwrite({
          schedules: data.schedules!,
          customTimes: data.customTimes!,
          selectedSchedules: data.selectedSchedules!,
          waivedRequirements: data.waivedRequirements!,
        }));
      },
      (err) => dispatch(setSnapshotError(err)),
    );

    // trigger initial write
    setDoc(ref, { lastLoggedIn: serverTimestamp() }, { merge: true })
      .then(() => console.info('updated last login time'))
      .catch((err) => dispatch(setSnapshotError(err)));

    return unsub;
  }, [uid]);

  return (
    <SearchStateProvider>
      <SelectedScheduleProvider>
        <Component {...pageProps} />
      </SelectedScheduleProvider>
    </SearchStateProvider>
  );
};

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
