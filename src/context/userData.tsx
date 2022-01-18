import { User } from 'firebase/auth';
import {
  FirestoreError,
  setDoc,
  onSnapshot,
  getDoc,
  serverTimestamp,
  DocumentSnapshot,
  updateDoc,
} from 'firebase/firestore';
import React, {
  createContext,
  useState,
  useCallback,
  useEffect,
  useMemo,
  useContext,
} from 'react';
import {
  UserData,
  Season,
  UserClassData,
  Schedule,
  SEASON_ORDER,
  Term,
  DayOfWeek,
} from '../../shared/firestoreTypes';
import {
  getDefaultSemesters,
  getUniqueSemesters,
  throwMissingContext,
} from '../../shared/util';
import { getUserRef } from '../hooks';

type ClassAndSchedule = { classId: string; scheduleId: string };

type UserDataContextType = {
  data: UserData;
  addCourses: (...courses: ClassAndSchedule[]) => void;
  removeCourses: (
    ...courses: { classId: string; scheduleId?: string }[]
  ) => Promise<UserData['schedules']>;
  createSchedule: (obj: {
    id: string;
    year: number;
    season: Season;
    classes?: UserClassData[];
    force?: boolean;
  }) => Promise<Schedule>;
  renameSchedule: (scheduleId: string, newId: string) => Promise<Schedule>;
  deleteSchedule: (scheduleId: string) => Promise<void>;
  selectSchedule: (
    year: number,
    season: Season,
    schedule: string | null
  ) => void;
  setCustomTime: (classId: string, pattern: DayOfWeek[], start: number, end: number) => Promise<void>;
  error?: FirestoreError;
};

function getUserDataFromSnapshot(snap: DocumentSnapshot<UserData> | null): UserData {
  const now = new Date();
  const data = snap?.data();
  const classYear = data?.classYear || now.getFullYear() + (now.getMonth() > 5 ? 4 : 3);
  const schedules = data?.schedules || {};
  const selectedSchedules = data?.selectedSchedules || {};
  getUniqueSemesters(classYear, Object.values(schedules)).forEach(
    (semester) => {
      const term: Term = `${semester.year}${semester.season}`;
      if (!selectedSchedules[term]) {
        selectedSchedules[term] = Object.values(schedules).find(
          ({ year, season }) => year === semester.year && season === semester.season,
        )?.id || null;
      }
    },
  );
  return {
    classYear,
    lastLoggedIn: snap?.get('lastLoggedIn') || now,
    schedules,
    selectedSchedules,
    customTimes: data?.customTimes || {},
  };
}

const defaultUserData = getUserDataFromSnapshot(null);

const UserDataContext = createContext<UserDataContextType>({
  data: defaultUserData,
  addCourses: throwMissingContext,
  removeCourses: throwMissingContext,
  createSchedule: throwMissingContext,
  renameSchedule: throwMissingContext,
  deleteSchedule: throwMissingContext,
  selectSchedule: throwMissingContext,
  setCustomTime: throwMissingContext,
});

/**
 * We put this in a separate context than the user to avoid unnecessary rerenders.
 * The state consists of the user data, which works both locally and if the user is not logged in,
 * and also a course cache which TOOD migrate to redis or something
 * and finally an error if there was problems fetching data.
 * The context also contains functions to simplify modifying the schedule.
 * If the user is logged in, userData will be an up-to-date view of their Firestore document.
 */
export const UserDataProvider: React.FC<{ user: User | null | undefined }> = function ({ children, user }) {
  const [userData, setUserData] = useState<UserData>(defaultUserData);
  const [error, setError] = useState<FirestoreError | undefined>();

  const createSchedule: UserDataContextType['createSchedule'] = useCallback(
    ({
      id, year, season, classes = [], force = false,
    }) => new Promise<Schedule>((resolve, reject) => {
      setUserData((prev) => {
        if (id in prev.schedules && !force) {
          process.nextTick(() => reject(new Error('id taken')));
          return prev;
        }
        if (typeof year !== 'number') {
          process.nextTick(() => reject(new Error('year must be a valid number')));
          return prev;
        }
        if (!(season in SEASON_ORDER)) {
          process.nextTick(() => reject(new Error('season must be a valid season')));
          return prev;
        }
        if (!Array.isArray(classes)) {
          process.nextTick(() => reject(new Error('classes must be an array')));
          return prev;
        }
        let newScheduleId = id;
        if (force) {
          let i = 1;
          while (newScheduleId in prev.schedules) {
            newScheduleId = `${id} (${i})`;
            i += 1;
          }
        }
        const newSchedule: Schedule = {
          id: newScheduleId,
          season,
          year,
          classes,
        };
        const schedules = {
          ...prev.schedules,
          [newScheduleId]: newSchedule,
        };

        if (user) {
          // @ts-expect-error
          updateDoc(getUserRef(user.uid), { schedules })
            .then(() => resolve(newSchedule))
            .catch((err) => reject(err));
        } else {
          process.nextTick(() => resolve(newSchedule));
        }
        return { ...prev, schedules };
      });
    }),
    [user],
  );

  const renameSchedule: UserDataContextType['renameSchedule'] = useCallback(
    (scheduleId: string, newId: string) => new Promise<Schedule>((resolve, reject) => {
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
        const schedules: Record<string, Schedule> = {
          ...rest,
          [newId]: newSchedule,
        };
        if (user) {
          // @ts-expect-error
          updateDoc(getUserRef(user.uid), { schedules })
            .then(() => resolve(newSchedule))
            .catch((err) => reject(err));
        } else {
          process.nextTick(() => resolve(newSchedule));
        }
        return { ...prev, schedules };
      });
    }),
    [user],
  );

  const deleteSchedule: UserDataContextType['deleteSchedule'] = useCallback(
    (scheduleId: string) => new Promise((resolve, reject) => {
      setUserData((prev) => {
        if (!(scheduleId in prev.schedules)) {
          process.nextTick(() => reject(new Error('schedule not found')));
          return prev;
        }
        // eslint-disable-next-line @typescript-eslint/naming-convention
        const { [scheduleId]: _, ...schedules } = prev.schedules;
        if (user) {
          // @ts-expect-error
          updateDoc(getUserRef(user.uid), { schedules })
            .then(() => resolve())
            .catch((err) => reject(err));
        } else {
          process.nextTick(() => resolve());
        }
        return { ...prev, schedules };
      });
    }),
    [user],
  );

  const addCourses: UserDataContextType['addCourses'] = useCallback(
    async (...classesToAdd: ClassAndSchedule[]) => {
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
          // @ts-expect-error
          updateDoc(getUserRef(user.uid), firestoreUpdate);
        }
        return { ...prev };
      });
      // setCourseCache((prev) => Object.assign({}, prev, ...courses.map(({ course }) => ({ [course.Key]: course }))));
    },
    [user],
  );

  const removeCourses: UserDataContextType['removeCourses'] = useCallback(
    (...classesToRemove) => new Promise<UserData['schedules']>((resolve, reject) => {
      setUserData((prev) => {
        const firestoreUpdate = {} as Record<string, UserClassData[]>;
        const newState: UserData = JSON.parse(JSON.stringify(prev));

        classesToRemove.forEach(
          ({ classId, scheduleId: fromScheduleId }) => {
            if (fromScheduleId) {
              const updatedClasses = prev.schedules[
                fromScheduleId
              ].classes.filter(({ classId: id }) => id !== classId);
              newState.schedules[fromScheduleId].classes = updatedClasses;
              firestoreUpdate[`schedules.${fromScheduleId}.classes`] = updatedClasses;
            } else {
              // remove from all schedules
              Object.entries(prev.schedules).forEach(
                ([scheduleId, schedule]) => {
                  const updatedClasses = schedule.classes.filter(
                    ({ classId: id }) => id !== classId,
                  );
                  if (updatedClasses.length !== schedule.classes.length) {
                    newState.schedules[scheduleId].classes = updatedClasses;
                    firestoreUpdate[`schedules.${scheduleId}.classes`] = updatedClasses;
                  }
                },
              );
            }
          },
        );

        if (user) {
          // @ts-expect-error
          updateDoc(getUserRef(user.uid), firestoreUpdate)
            .then(() => resolve(newState.schedules))
            .catch(reject);
        } else {
          process.nextTick(() => resolve(newState.schedules));
        }

        return newState;
      });
    }),
    [user],
  );

  const selectSchedule: UserDataContextType['selectSchedule'] = useCallback(
    (year: number, season: Season, scheduleId: string | null) => new Promise<void>((resolve, reject) => {
      setUserData((prev) => {
        // if scheduleId is falsy, that means we delete the data
        if (!scheduleId) {
          const newSelectedSchedules = {
            ...prev.selectedSchedules,
            [year + season]: null,
          };
          if (user) {
            setDoc(
              getUserRef(user.uid),
              {
                selectedSchedules: newSelectedSchedules,
              },
              { merge: true },
            )
              .then(resolve)
              .catch(reject);
          } else {
            process.nextTick(resolve);
          }

          return {
            ...prev,
            selectedSchedules: newSelectedSchedules,
          };
        }

        const schedule = prev.schedules[scheduleId];
        if (!schedule) {
          process.nextTick(() => reject(new Error('invalid schedule id')));
          return prev;
        }

        const newSelectedSchedules = {
          ...prev.selectedSchedules,
          [year + season]: scheduleId,
        };

        if (user) {
          updateDoc(
            getUserRef(user.uid),
            // @ts-expect-error
            {
              selectedSchedules: newSelectedSchedules,
            },
          )
            .then(resolve)
            .catch(reject);
        } else {
          process.nextTick(resolve);
        }

        return {
          ...prev,
          selectedSchedules: newSelectedSchedules,
        };
      });
    }),
    [user],
  );

  const setCustomTime: UserDataContextType['setCustomTime'] = useCallback((classId: string, pattern: DayOfWeek[], start: number, end: number) => new Promise((resolve, reject) => {
    setUserData((prev) => {
      const newCustomTimes = {
        ...prev.customTimes,
        [classId]: { pattern, start, end },
      };

      if (user) {
        updateDoc(
          getUserRef(user.uid),
          // @ts-expect-error
          { customTimes: newCustomTimes },
        ).then(resolve).catch(reject);
      } else {
        process.nextTick(resolve);
      }

      return {
        ...prev,
        customTimes: newCustomTimes,
      };
    });
  }), [user]);

  // listen to user firestore document
  useEffect(() => {
    if (!user) return;

    const unsub = onSnapshot<UserData>(
      getUserRef(user.uid),
      (s) => {
        setUserData(getUserDataFromSnapshot(s));
      },
      (err) => setError(err),
    );

    getDoc(getUserRef(user.uid)).then((snap) => {
      // create a document if one doesn't exist. this also triggers the listener below
      if (snap.exists()) {
        // console.log('snap exists');
        // setUserData(getUserDataFromSnapshot(snap));
        return;
      }
      const now = new Date();
      const classYear = now.getFullYear() + (now.getMonth() > 5 ? 4 : 3);
      const schedules: Record<string, Schedule> = {};
      getDefaultSemesters(classYear).forEach(({ year, season }) => {
        schedules[`${season} ${year}`] = {
          year,
          season,
          id: `${season} ${year}`,
          classes: [],
        };
      });
      setDoc(
        getUserRef(user.uid),
        {
          lastLoggedIn: serverTimestamp(),
          classYear,
          schedules,
        },
        { merge: true },
      ).catch((err) => setError(err));
    });

    // eslint-disable-next-line consistent-return
    return unsub;
  }, [user]);

  const value = useMemo<UserDataContextType>(
    () => ({
      data: userData,
      addCourses,
      removeCourses,
      createSchedule,
      renameSchedule,
      deleteSchedule,
      selectSchedule,
      setCustomTime,
      error,
    }),
    [
      userData,
      addCourses,
      removeCourses,
      createSchedule,
      renameSchedule,
      deleteSchedule,
      setCustomTime,
      selectSchedule,
      error,
    ],
  );

  return (
    <UserDataContext.Provider value={value}>
      {children}
    </UserDataContext.Provider>
  );
};

const useUserData = () => useContext(UserDataContext);

export default useUserData;
