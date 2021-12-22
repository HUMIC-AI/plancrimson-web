import { getAuth, onAuthStateChanged, User } from 'firebase/auth';
import {
  doc, DocumentReference, FirestoreError, getDoc, getFirestore, onSnapshot, serverTimestamp, setDoc, updateDoc,
} from 'firebase/firestore';
import React, {
  createContext, useCallback, useContext, useEffect, useMemo, useState,
} from 'react';
import {
  Season, seasonOrder, UserClassData,
} from './schedules';
import { Class } from './types';

type UserContextType = {
  user?: User | null;
  error?: Error,
};

export interface Schedule {
  id: string;
  year: number;
  season: Season;
  classes: UserClassData[];
}

// firestore user schema
export interface UserData {
  classYear: number;
  lastLoggedIn: Date;
  schedules: {
    [semesterId: string]: Schedule;
  };
}

type ClassAndSchedule = { classId: string; scheduleId: string };

type RemoveCourses = (...courses: { classId: string; scheduleId?: string }[]) => void;

type UserDataContextType = {
  data: UserData;
  addCourses: (...courses: ClassAndSchedule[]) => void;
  removeCourses: RemoveCourses;
  createSchedule: (scheduleId: string, year: number, season: Season) => void;
  error?: FirestoreError;
};

const UserContext = createContext<UserContextType>({});

const UserDataContext = createContext<UserDataContextType>({
  data: {
    lastLoggedIn: new Date(),
    classYear: 2025,
    schedules: {},
  },
  addCourses: () => null,
  removeCourses: () => null,
  createSchedule: () => null,
});

export function getClassId(course: Class) { return course.HU_STRM_CLASSNBR; }

export function getUserRef({ uid }: User) { return doc(getFirestore(), `users/${uid}`) as DocumentReference<UserData>; }

export function getAllSemesters(data: UserData) {
  const semesters = [] as { year: number, season: Season }[];
  Object.values(data.schedules).forEach(({ year, season }) => {
    // if this semester has not yet been added
    if (!semesters.find(({ year: y, season: s }) => year === y && season === s)) {
      semesters.push({ year, season });
    }
  });
  return semesters.sort((a, b) => {
    if (a.year !== b.year) return a.year - b.year;
    const seasonDiff = seasonOrder[a.season] - seasonOrder[b.season];
    return seasonDiff;
  });
}

export function getSchedulesBySemester(data: UserData, targetYear: number, targetSeason: Season) {
  return Object.values(data.schedules).filter(({ year, season }) => year === targetYear && season === targetSeason);
}

export function getAllClassIds(data: UserData) {
  return Object.values(data.schedules).flatMap((schedule) => schedule.classes.map((cls) => cls.id));
}

/**
 * We put this in a separate context than the user to avoid unnecessary rerenders.
 * The state consists of the user data, which works both locally and if the user is not logged in,
 * and also a course cache which TOOD migrate to redis or something
 * and finally an error if there was problems fetching data.
 * The context also contains functions to simplify modifying the schedule.
 * If the user is logged in, userData will be an up-to-date view of their Firestore document.
 */
export const UserDataProvider: React.FC<{ user?: User | null }> = function ({ children, user }) {
  const [userData, setUserData] = useState<UserData>({ classYear: 2025, schedules: {}, lastLoggedIn: new Date() });
  const [error, setError] = useState<FirestoreError | undefined>();

  const createSchedule: UserDataContextType['createSchedule'] = useCallback(async (scheduleId, year, season) => {
    setUserData((prev) => {
      if (scheduleId in prev.schedules) return prev;
      // eslint-disable-next-line no-param-reassign
      prev.schedules[`${scheduleId}`] = {
        id: scheduleId, season, year, classes: [],
      };
      if (user) {
        setDoc(getUserRef(user), { schedules: prev.schedules }, { merge: true })
          .then(() => console.log('user updated'))
          .catch((err) => setError(err));
      }
      return prev;
    });
  }, [user]);

  const addCourses = useCallback(async (...classesToAdd: ClassAndSchedule[]) => {
    setUserData((prev) => {
      const firestoreUpdate = {} as Record<string, UserClassData[]>;
      classesToAdd.forEach(({ classId, scheduleId }) => {
        const { classes } = prev.schedules[scheduleId];
        if (!classes.find(({ id }) => id === classId)) {
          classes.push({ id: classId });
          firestoreUpdate[`schedules.${scheduleId}.classes`] = classes;
        }
      });
      if (user) {
        updateDoc(getUserRef(user), firestoreUpdate as any);
      }
      return prev;
    });
    // setCourseCache((prev) => Object.assign({}, prev, ...courses.map(({ course }) => ({ [course.Key]: course }))));
  }, [user]);

  const removeCourses: RemoveCourses = useCallback((...classesToRemove) => {
    setUserData((prev) => {
      const firestoreUpdate = {} as Record<string, UserClassData[]>;
      classesToRemove.forEach(({ classId, scheduleId: targetScheduleId }) => {
        if (targetScheduleId) {
          const updatedClasses = prev.schedules[targetScheduleId].classes.filter(({ id }) => id !== classId);
          // eslint-disable-next-line no-param-reassign
          prev.schedules[targetScheduleId].classes = updatedClasses;
          firestoreUpdate[`schedules.${targetScheduleId}.classes`] = updatedClasses;
        } else {
          Object.entries(prev.schedules).forEach(([scheduleId, schedule]) => {
            const updatedClasses = schedule.classes.filter(({ id }) => id !== classId);
            if (updatedClasses.length !== schedule.classes.length) {
              // eslint-disable-next-line no-param-reassign
              prev.schedules[scheduleId].classes = updatedClasses;
              firestoreUpdate[`schedules.${scheduleId}.classes`] = updatedClasses;
            }
          });
        }
      });
      if (user) {
        updateDoc(getUserRef(user), firestoreUpdate as any)
          .then(() => console.log('doc updated'))
          .catch((err) => console.error('error removing courses', err));
      }
      return prev;
    });
  }, [user]);

  useEffect(() => {
    if (!user) return;

    const unsub = onSnapshot<UserData>(getUserRef(user), (s) => {
      const now = new Date();
      setUserData({
        classYear: s.get('classYear') || now.getFullYear() + (now.getMonth() > 5 ? 4 : 3),
        lastLoggedIn: s.get('lastLoggedIn') || now,
        schedules: s.get('schedules') || {},
      });
    }, (err) => setError(err));

    getDoc(getUserRef(user)).then((snap) => {
      // create a document if one doesn't exist. this also triggers the listener below
      if (!snap.exists()) {
        const now = new Date();
        const classYear = now.getFullYear() + (now.getMonth() > 5 ? 4 : 3);
        setDoc(getUserRef(user), {
          lastLoggedIn: serverTimestamp(),
          classYear,
          schedules: Object.assign({}, ...[...new Array(5)].flatMap((_, i) => {
            const year = classYear - 4 + i;
            return [{
              [`Spring ${year}`]: {
                id: `Spring ${year}`, classes: [], season: 'Spring', year,
              },
            },
            {
              [`Fall ${year}`]: {
                id: `Fall ${year}`, classes: [], season: 'Fall', year,
              },
            }] as Record<string, Schedule>[];
          }).slice(1, -1)),
        }, { merge: true })
          .then(() => console.log('new document created'))
          .catch((err) => setError(err));
      } else {
        setUserData(snap.data());
      }
    });

    // eslint-disable-next-line consistent-return
    return unsub;
  }, [user]);

  const value = useMemo<UserDataContextType>(() => ({
    data: userData,
    addCourses,
    removeCourses,
    createSchedule,
    error,
  }), [userData, addCourses, removeCourses, createSchedule, error]);

  return (
    <UserDataContext.Provider value={value}>
      {children}
    </UserDataContext.Provider>
  );
};

export const UserContextProvider: React.FC = function ({ children }) {
  const [user, setUser] = useState<User | null | undefined>();
  const [authError, setAuthError] = useState<Error | undefined>();

  useEffect(() => {
    const unsub = onAuthStateChanged(getAuth(), (u) => {
      setUser(u);
    }, (err) => {
      setAuthError(err);
    });
    return unsub;
  }, []);

  const value = useMemo<UserContextType>(() => ({
    user,
    error: authError,
  } as UserContextType), [user, authError]);

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => useContext(UserContext);
export const useUserData = () => useContext(UserDataContext);
