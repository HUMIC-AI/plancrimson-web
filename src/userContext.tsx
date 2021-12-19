import { getAuth, onAuthStateChanged, User } from 'firebase/auth';
import {
  arrayRemove,
  arrayUnion,
  doc, FirestoreError, getFirestore, onSnapshot, serverTimestamp, setDoc, updateDoc,
} from 'firebase/firestore';
import React, {
  createContext, useCallback, useContext, useEffect, useMemo, useState,
} from 'react';
import { Course } from './types';

export type ScheduleEntry = {
  season: string;
  year: number;
  course: string;
};

type FullScheduleEntry = { year: number; season: string; course: Course };

type CourseCache = {
  [key: string]: Course
};

type ScheduleSetter = React.Dispatch<React.SetStateAction<Array<ScheduleEntry>>>;

type UserResponse = ({
  user?: User | null;
  authError?: Error,
  dataError?: FirestoreError;
  schedule: Array<ScheduleEntry>;
  addCourses: (...courses: Array<FullScheduleEntry>) => void;
  removeCourses: (...courses: Array<FullScheduleEntry>) => void;
  setSchedule: ScheduleSetter;
  courseCache: CourseCache;
});

export const UserContext = createContext<UserResponse>({
  schedule: [],
  addCourses: () => null,
  removeCourses: () => null,
  setSchedule: () => null,
  courseCache: {},
});

const extractCourseKey = ({ year, season, course }: FullScheduleEntry) => ({ year, season, course: course.Key });

const getUserRef = ({ uid }: User) => doc(getFirestore(), `users/${uid}`);

export const UserContextProvider: React.FC = function ({ children }) {
  const [user, setUser] = useState<User | null | undefined>();
  const [authError, setAuthError] = useState<Error | undefined>();
  const [dataError, setDataError] = useState<FirestoreError | undefined>();
  const [schedule, setSchedule] = useState<Array<ScheduleEntry>>([]);
  const [courseCache, setCourseCache] = useState<CourseCache>({});

  useEffect(() => {
    const unsub = onAuthStateChanged(getAuth(), (u) => {
      setUser(u);
    }, (err) => {
      setUser(null);
      setAuthError(err);
    });
    return unsub;
  }, []);

  const addCourses = useCallback((...courses: Array<FullScheduleEntry>) => {
    if (user) {
      updateDoc(getUserRef(user), {
        schedule: arrayUnion(...courses.map(extractCourseKey)),
      });
    } else {
      setSchedule((prev) => [
        ...prev.filter(({ course: existingKey }) => !courses.find((c) => c.course.Key === existingKey)),
        ...courses.map(extractCourseKey),
      ]);
    }
    setCourseCache((prev) => Object.assign({}, prev, ...courses.map(({ course }) => ({ [course.Key]: course }))));
  }, [user]);

  const removeCourses = useCallback((...courses: Array<FullScheduleEntry>) => {
    if (user) {
      updateDoc(getUserRef(user), {
        schedule: arrayRemove(...courses.map(extractCourseKey)),
      }).then(() => console.log('doc updated'))
        .catch((err) => console.error('error removing courses', err));
    } else {
      setSchedule((prev) => prev.filter(({ course: existingKey }) => !courses.find((c) => c.course.Key === existingKey)));
    }
  }, [user]);

  const setScheduleWrapper: ScheduleSetter = useCallback((action) => {
    setSchedule((prev) => {
      const newSchedule = typeof action === 'function' ? action(prev) : action;
      if (user) {
        updateDoc(getUserRef(user), {
          schedule: newSchedule,
        }).then(() => console.log('doc updated'))
          .catch((err) => console.error('error updating schedule', err));
      }
      return newSchedule;
    });
  }, [user]);

  useEffect(() => {
    if (!user) return;

    console.log('creating snapshot listener');

    const ref = doc(getFirestore(), `users/${user.uid}`);

    const unsub = onSnapshot(ref, (s) => {
      console.log('snap set to', s.data());
      setDataError(undefined);
      setSchedule(s.get('schedule') || []);
    }, (err) => {
      setDataError(err);
    });

    // create a document if one doesn't exist. this also triggers the listener below
    setDoc(ref, { lastLoggedIn: serverTimestamp() }, { merge: true })
      .then(() => console.log('new document created'))
      .catch((err) => setDataError(err));

    // eslint-disable-next-line consistent-return
    return unsub;
  }, [user]);

  const value = useMemo<UserResponse>(() => ({
    user,
    authError,
    dataError,
    schedule,
    addCourses,
    removeCourses,
    setSchedule: setScheduleWrapper,
    courseCache,
  } as UserResponse), [user, authError, dataError, schedule, addCourses, removeCourses, setScheduleWrapper, courseCache]);

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => useContext(UserContext);
