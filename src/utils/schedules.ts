import { onSnapshot, query, QueryConstraint } from 'firebase/firestore';
import { useEffect } from 'react';
import { compareSemesters, Semester } from 'plancrimson-utils';
import { ClassCache, Schedules } from '../features';
import { useAppDispatch } from './hooks';
import { useMeiliClient } from '../context/meili';
import Firestore from '../schema';
import { Schedule, ScheduleMap } from '../types';

/**
 * Listen to all schedules on Firestore that meet the given constraints.
 * Load these schedules into the Redux store and also load all courses from all schedules into the Redux "class cache".
 * Expects access to the MeiliSearch client through React Context.
 */
export default function useSyncSchedulesMatchingContraints(constraints: QueryConstraint[]) {
  const dispatch = useAppDispatch();
  const { client } = useMeiliClient();

  useEffect(() => {
    const q = query(Firestore.Collection.schedules(), ...constraints);
    const unsubSchedules = onSnapshot(q, (snap) => {
      const scheduleEntries = snap.docs.map((doc) => doc.data());
      const classIds = scheduleEntries.flatMap((schedule) => schedule.classes.map(({ classId }) => classId));

      console.debug('[useSchedules] Reloaded schedules');

      // load all of the classes into the class cache
      if (client) {
        dispatch(ClassCache.loadCourses(client, classIds));
      }

      dispatch(Schedules.overwriteSchedules(scheduleEntries));
    }, (err) => {
      console.error('[useSchedules] error listening for schedules (in the layout):', err);
    });

    return unsubSchedules;
  }, [constraints, client]);
}

export function getSchedulesBySemester(
  schedules: ScheduleMap,
  semester: Semester,
) {
  return sortSchedules(schedules).filter(
    ({ year, season }) => year === semester.year && season === semester.season,
  );
}

export function sortSchedules(schedules: ScheduleMap) {
  return Object.values(schedules).sort(compareSemesters);
}

export function getAllClassIds(schedules: Schedule[]): string[] {
  return schedules.flatMap((schedule) => schedule.classes.map((cls) => cls.classId));
}
