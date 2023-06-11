import {
  onSnapshot, query, QueryConstraint, QuerySnapshot,
} from 'firebase/firestore';
import { useCallback, useEffect } from 'react';
import { compareSemesters, Semester } from '@/src/lib';
import { ClassCache, Schedules } from '../features';
import { alertUnexpectedError, useAppDispatch } from './hooks';
import { useMeiliClient } from '../context/meili';
import type {
  FirestoreSchedule,
  ListOfScheduleIdOrSemester, ScheduleId, ScheduleIdOrSemester, ScheduleMap,
} from '../types';
import { toLocalSchedule } from '../features/schedules';
import Schema, { queryWithId } from '../schema';

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

  const updateSchedules = useCallback(async (snap: QuerySnapshot<FirestoreSchedule>) => {
    try {
      const schedules = snap.docs.map((doc) => doc.data());

      console.info('[useSchedules] Reloaded schedules');

      // load all of the classes into the class cache
      if (client) {
        await dispatch(ClassCache.loadCourses(client, getAllClassIds(schedules)));
      }

      dispatch(Schedules.overwriteSchedules(schedules.map(toLocalSchedule)));
    } catch (err) {
      alertUnexpectedError(err);
    }
  }, [client]);

  useEffect(() => {
    if (constraints === null) return;

    const q = query(Schema.Collection.schedules(), ...constraints);

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

export function getAllClassIds(schedules: { classes: string[] }[]): string[] {
  return schedules.flatMap((schedule) => schedule.classes);
}

export function getSemesterBeforeEarliest(schedules: ScheduleMap): Semester {
  const earliest = sortSchedulesBySemester(schedules)[0];
  const [season, year] = earliest.season === 'Spring'
    ? ['Fall' as const, earliest.year - 1]
    : ['Spring' as const, earliest.year];
  return { season, year };
}

export async function getOtherSchedulesAcrossSemesters(
  ignoreUser: string,
  friendIds: string[],
  semesters?: Semester[],
  limit = 50,
) {
  const queries = semesters ? semesters.map((semester) => [
    queryWithId(Schema.Collection.schedules(), {
      ...semester,
      ignoreUser,
      publicOnly: true,
      pageSize: limit,
    }),
    ...friendIds.map((uid) => queryWithId(Schema.Collection.schedules(), {
      ...semester,
      user: uid,
    })),
  ]) : [
    queryWithId(Schema.Collection.schedules(), {
      ignoreUser,
      publicOnly: true,
      pageSize: limit,
    }),
    ...friendIds.map((uid) => queryWithId(Schema.Collection.schedules(), {
      user: uid,
    })),
  ];

  const schedules = await Promise.all(queries.flat());

  return schedules.flat();
}
