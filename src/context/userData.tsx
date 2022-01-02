import { User } from 'firebase/auth';
import {
  FirestoreError, setDoc, updateDoc, onSnapshot, getDoc, serverTimestamp,
} from 'firebase/firestore';
import React, {
  createContext, useState, useCallback, useEffect, useMemo, useContext,
} from 'react';
import {
  UserData, Season, UserClassData, Schedule,
} from '../../shared/firestoreTypes';
import { throwMissingContext } from '../../shared/util';
import { getUserRef } from '../hooks';

type ClassAndSchedule = { classId: string; scheduleId: string };

type RemoveCourses = (...courses: { classId: string; scheduleId?: string }[]) => void;

type UserDataContextType = {
  data: UserData;
  addCourses: (...courses: ClassAndSchedule[]) => void;
  removeCourses: RemoveCourses;
  createSchedule: (scheduleId: string, year: number, season: Season, classes?: UserClassData[]) => Promise<Schedule>;
  renameSchedule: (scheduleId: string, newId: string) => Promise<Schedule>;
  deleteSchedule: (scheduleId: string) => Promise<void>;
  error?: FirestoreError;
};

const UserDataContext = createContext<UserDataContextType>({
  data: {
    lastLoggedIn: new Date(),
    classYear: 2025,
    schedules: {},
  },
  addCourses: throwMissingContext,
  removeCourses: throwMissingContext,
  createSchedule: throwMissingContext,
  renameSchedule: throwMissingContext,
  deleteSchedule: throwMissingContext,
});

const generateSchedules = (classYear: number) => {
  const schedules: Record<string, Schedule> = {};

  for (let year = classYear - 4; year <= classYear; year += 1) {
    if (year > classYear - 4) {
      schedules[`Spring ${year}`] = {
        id: `Spring ${year}`, classes: [], season: 'Spring', year,
      };
    }
    if (year < classYear) {
      schedules[`Fall ${year}`] = {
        id: `Fall ${year}`, classes: [], season: 'Fall', year,
      };
    }
  }

  return schedules;
};

/**
 * We put this in a separate context than the user to avoid unnecessary rerenders.
 * The state consists of the user data, which works both locally and if the user is not logged in,
 * and also a course cache which TOOD migrate to redis or something
 * and finally an error if there was problems fetching data.
 * The context also contains functions to simplify modifying the schedule.
 * If the user is logged in, userData will be an up-to-date view of their Firestore document.
 */
export const UserDataProvider: React.FC<{ user: User | null | undefined }> = function ({ children, user }) {
  const [userData, setUserData] = useState<UserData>({ classYear: 2025, schedules: {}, lastLoggedIn: new Date() });
  const [error, setError] = useState<FirestoreError | undefined>();

  const createSchedule: UserDataContextType['createSchedule'] = useCallback((scheduleId, year, season, classes = []) => new Promise<Schedule>((resolve, reject) => {
    setUserData((prev) => {
      if (scheduleId in prev.schedules) {
        process.nextTick(() => reject(new Error('id taken')));
        return prev;
      }
      const newSchedule: Schedule = {
        id: scheduleId, season, year, classes,
      };
      const schedules = {
        ...prev.schedules,
        [scheduleId]: newSchedule,
      };

      if (user) {
        updateDoc(getUserRef(user.uid), { schedules })
          .then(() => resolve(newSchedule))
          .catch((err) => reject(err));
      } else {
        process.nextTick(() => resolve(newSchedule));
      }
      return { ...prev, schedules };
    });
  }), [user]);

  const renameSchedule: UserDataContextType['renameSchedule'] = useCallback((scheduleId: string, newId: string) => new Promise<Schedule>((resolve, reject) => {
    setUserData((prev) => {
      if (!(scheduleId in prev.schedules)) {
        process.nextTick(() => reject(new Error('schedule not found')));
        return prev;
      }
      if (newId in prev.schedules) {
        process.nextTick(() => reject(new Error('id taken')));
        return prev;
      }

      const { [scheduleId]: oldSchedule, ...rest } = prev.schedules;
      const newSchedule: Schedule = { ...oldSchedule, id: newId };
      const schedules: Record<string, Schedule> = { ...rest, [newId]: newSchedule };
      if (user) {
        updateDoc(getUserRef(user.uid), { schedules })
          .then(() => resolve(newSchedule))
          .catch((err) => reject(err));
      } else {
        process.nextTick(() => resolve(newSchedule));
      }
      return { ...prev, schedules };
    });
  }), [user]);

  const deleteSchedule: UserDataContextType['deleteSchedule'] = useCallback((scheduleId: string) => new Promise((resolve, reject) => {
    setUserData((prev) => {
      if (!(scheduleId in prev.schedules)) {
        process.nextTick(() => reject(new Error('schedule not found')));
        return prev;
      }
      // eslint-disable-next-line @typescript-eslint/naming-convention
      const { [scheduleId]: _, ...schedules } = prev.schedules;
      if (user) {
        updateDoc(getUserRef(user.uid), { schedules })
          .then(() => resolve())
          .catch((err) => reject(err));
      } else {
        process.nextTick(() => resolve());
      }
      return { ...prev, schedules };
    });
  }), [user]);

  const addCourses = useCallback(async (...classesToAdd: ClassAndSchedule[]) => {
    setUserData((prev) => {
      const firestoreUpdate = {} as Record<string, UserClassData[]>;
      classesToAdd.forEach(({ classId, scheduleId }) => {
        const { classes } = prev.schedules[scheduleId];
        if (!classes.find(({ classId: id }) => id === classId)) {
          classes.push({ classId });
          firestoreUpdate[`schedules.${scheduleId}.classes`] = classes;
        }
      });
      if (user) {
        updateDoc(getUserRef(user.uid), firestoreUpdate as any);
      }
      return { ...prev };
    });
    // setCourseCache((prev) => Object.assign({}, prev, ...courses.map(({ course }) => ({ [course.Key]: course }))));
  }, [user]);

  const removeCourses: RemoveCourses = useCallback((...classesToRemove) => {
    setUserData((prev) => {
      const firestoreUpdate = {} as Record<string, UserClassData[]>;
      const newState = { ...prev };

      classesToRemove.forEach(({ classId, scheduleId: fromScheduleId }) => {
        if (fromScheduleId) {
          const updatedClasses = prev.schedules[fromScheduleId].classes.filter(({ classId: id }) => id !== classId);
          newState.schedules[fromScheduleId].classes = updatedClasses;
          firestoreUpdate[`schedules.${fromScheduleId}.classes`] = updatedClasses;
        } else {
          // remove from all schedules
          Object.entries(prev.schedules).forEach(([scheduleId, schedule]) => {
            const updatedClasses = schedule.classes.filter(({ classId: id }) => id !== classId);
            if (updatedClasses.length !== schedule.classes.length) {
              newState.schedules[scheduleId].classes = updatedClasses;
              firestoreUpdate[`schedules.${scheduleId}.classes`] = updatedClasses;
            }
          });
        }
      });

      if (user) {
        updateDoc(getUserRef(user.uid), firestoreUpdate as any)
          .then(() => console.log('doc updated'))
          .catch((err) => console.error('error removing courses', err));
      }

      return newState;
    });
  }, [user]);

  useEffect(() => {
    if (!user) return;

    const unsub = onSnapshot<UserData>(getUserRef(user.uid), (s) => {
      const now = new Date();
      setUserData({
        classYear: s.get('classYear') || now.getFullYear() + (now.getMonth() > 5 ? 4 : 3),
        lastLoggedIn: s.get('lastLoggedIn') || now,
        schedules: s.get('schedules') || {},
      });
    }, (err) => setError(err));

    getDoc(getUserRef(user.uid)).then((snap) => {
      // create a document if one doesn't exist. this also triggers the listener below
      if (!snap.exists()) {
        const now = new Date();
        const classYear = now.getFullYear() + (now.getMonth() > 5 ? 4 : 3);
        setDoc(getUserRef(user.uid), {
          lastLoggedIn: serverTimestamp(),
          classYear,
          schedules: generateSchedules(classYear),
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
    renameSchedule,
    deleteSchedule,
    error,
  }), [userData, addCourses, removeCourses, createSchedule, renameSchedule, deleteSchedule, error]);

  return (
    <UserDataContext.Provider value={value}>
      {children}
    </UserDataContext.Provider>
  );
};

const useUserData = () => useContext(UserDataContext);

export default useUserData;
