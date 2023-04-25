import {
  getDocs, onSnapshot, query, QueryConstraint, QuerySnapshot,
} from 'firebase/firestore';
import { useCallback, useEffect } from 'react';
import { compareSemesters, Semester } from '@/src/lib';
import { ClassCache, Schedules } from '../features';
import { alertUnexpectedError, useAppDispatch } from './hooks';
import { useMeiliClient } from '../context/meili';
import Firestore from '../schema';
import type {
  ListOfScheduleIdOrSemester, Schedule, ScheduleId, ScheduleIdOrSemester, ScheduleMap,
} from '../types';

export function isScheduleId(s: ScheduleIdOrSemester): s is ScheduleId {
  return typeof s === 'string';
}

export function isListOfScheduleIds(s: ListOfScheduleIdOrSemester): s is ScheduleId[] {
  return (s as ScheduleIdOrSemester[]).every(isScheduleId);
}

/**
 * Listen to all schedules on Firestore that meet the given constraints.
 * Load these schedules into the Redux store and also load all courses from all schedules into the Redux "class cache".
 * Expects access to the MeiliSearch client through React Context.
 */
export default function useSyncSchedulesMatchingContraints(constraints: QueryConstraint[] | null) {
  const dispatch = useAppDispatch();
  const { client } = useMeiliClient();

  const updateSchedules = useCallback((snap: QuerySnapshot<Schedule>) => {
    const scheduleEntries = snap.docs.map((doc) => doc.data());
    const classIds = scheduleEntries.flatMap((schedule) => schedule.classes.map(({ classId }) => classId));

    console.debug('[useSchedules] Reloaded schedules');

    // load all of the classes into the class cache
    if (client) {
      dispatch(ClassCache.loadCourses(client, classIds));
    }

    dispatch(Schedules.overwriteSchedules(scheduleEntries));
  }, [client]);

  useEffect(() => {
    if (constraints === null) return;
    const q = query(Firestore.Collection.schedules(), ...constraints);
    getDocs(q).then(updateSchedules).catch(alertUnexpectedError);
    const unsubSchedules = onSnapshot(q, updateSchedules, (err) => {
      console.error('[useSchedules] error listening for schedules (in the layout):', err);
    });

    return unsubSchedules;
  }, [constraints, client]);
}

export function getSchedulesBySemester(
  schedules: ScheduleMap,
  semester: Semester,
) {
  return sortSchedulesBySemester(schedules).filter(
    ({ year, season }) => year === semester.year && season === semester.season,
  );
}

export function getPreviousSchedule(schedules: ScheduleMap, scheduleId: string) {
  const schedule = schedules[scheduleId];
  const schedulesFromSameSemester = getSchedulesBySemester(schedules, schedule);
  const previous = schedulesFromSameSemester.find((s) => s.id !== scheduleId);
  return previous;
}

export function sortSchedulesBySemester(schedules: ScheduleMap) {
  return Object.values(schedules).sort(compareSemesters);
}

export function getAllClassIds(schedules: Schedule[]): string[] {
  return schedules.flatMap((schedule) => schedule.classes.map((cls) => cls.classId));
}

export function getSemesterBeforeEarliest(schedules: ScheduleMap): Semester {
  const earliest = sortSchedulesBySemester(schedules)[0];
  const [season, year] = earliest.season === 'Spring'
    ? ['Fall' as const, earliest.year - 1]
    : ['Spring' as const, earliest.year];
  return { season, year };
}
