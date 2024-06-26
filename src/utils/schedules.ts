import {
  onSnapshot, query, where,
} from 'firebase/firestore';
import {
  useEffect, useMemo, useState,
} from 'react';
import {
  compareSemesters, CURRENT_COURSES_TERMS, Semester, semesterToTerm,
} from '@/src/lib';
import { ClassCache, Schedules } from '../features';
import { alertUnexpectedError, useAppDispatch, useAppSelector } from './hooks';
import { useMeiliClient } from '../context/meili';
import type {
  BaseSchedule,
  ListOfScheduleIdOrSemester, ScheduleId, ScheduleIdOrSemester, ScheduleMap, WithId,
} from '../types';
import Schema from '../schema';
import { GRAPH_SCHEDULE } from '../features/schedules';

export function isScheduleId(s: ScheduleIdOrSemester): s is ScheduleId {
  return typeof s === 'string';
}

export function isListOfScheduleIds(s: ListOfScheduleIdOrSemester): s is ScheduleId[] {
  return (s as ScheduleIdOrSemester[]).every(isScheduleId);
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
  return Object.values(schedules).filter((s) => s.id !== GRAPH_SCHEDULE).sort(compareSemesters);
}

export function getAllClassIds(schedules: { classes?: string[] }[]): string[] {
  return schedules.flatMap((schedule) => schedule.classes ?? []);
}

export function getSemesterBeforeEarliest(schedules: ScheduleMap): Semester {
  const earliest = sortSchedulesBySemester(schedules)[0];
  const [season, year] = earliest.season === 'Spring'
    ? ['Fall' as const, earliest.year - 1]
    : ['Spring' as const, earliest.year];
  return { season, year };
}

/**
 * Listen to the Firestore document of the given schedule.
 */
export function useSchedule(scheduleId?: string | null) {
  const dispatch = useAppDispatch();

  const [schedule, setSchedule] = useState<BaseSchedule | null>(null);
  const graphSchedule = useAppSelector(Schedules.selectSchedule(GRAPH_SCHEDULE));
  const [error, setError] = useState<string>();
  const { client } = useMeiliClient();

  useEffect(() => {
    if (!scheduleId || scheduleId === GRAPH_SCHEDULE) return;

    const unsub = onSnapshot(Schema.schedule(scheduleId), (snap) => {
      if (snap.exists()) {
        const scheduleData = snap.data()!;
        setSchedule(scheduleData);
        if (client && scheduleData.classes) {
          dispatch(ClassCache.loadCourses(client, scheduleData.classes));
        }
      }
    }, (err) => setError(err.message));

    return unsub;
  }, [scheduleId, client, dispatch]);

  if (scheduleId === GRAPH_SCHEDULE) {
    return { schedule: graphSchedule, error };
  }

  return { schedule, error };
}

/**
 * Get the schedules of each of the given useres that contain the given course.
 */
export function useSharedCourses(friendIds: string[] | undefined, courseId?: string) {
  const dispatch = useAppDispatch();
  const { client } = useMeiliClient();
  const [schedules, setSchedules] = useState<Record<string, WithId<BaseSchedule>[]>>({});

  useEffect(() => {
    if (!friendIds) return;

    const unsubs = friendIds.map((friend) => {
      const constraints = [where('ownerUid', '==', friend)];

      if (courseId) constraints.push(where('classes', 'array-contains', courseId));

      const q = query(
        Schema.Collection.schedules(),
        ...constraints,
      );

      return onSnapshot(q, (snap) => {
        const newSchedules = snap.docs.map((doc) => ({
          ...doc.data(),
          id: doc.id,
        }));

        setSchedules((prev) => ({
          ...prev,
          [friend]: newSchedules,
        }));

        if (client) {
          dispatch(ClassCache.loadCourses(client, getAllClassIds(newSchedules)));
        }
      }, alertUnexpectedError);
    });

    return () => unsubs.forEach((unsub) => unsub());
  }, [client, courseId, dispatch, friendIds]);

  return schedules;
}


/**
 * Get the classes of a given schedule.
 * Returns undefined if scheduleId is provided but the data is still loading.
 * If scheduleId is null, returns an empty array.
 */
export function useClasses(scheduleId: string | null) {
  const { schedule } = useSchedule(scheduleId);
  const fixedClasses = useMemo(() => {
    if (!scheduleId) return [];
    if (!schedule) return undefined;
    return schedule.classes ?? [];
  }, [schedule, scheduleId]);
  return fixedClasses;
}

export function useAvailableScheduleIds() {
  const schedules = useAppSelector(Schedules.selectSchedules);
  const availableScheduleIds = useMemo(() => sortSchedulesBySemester(schedules)
    .filter((s) => CURRENT_COURSES_TERMS.includes(semesterToTerm(s)))
    .map((s) => s.id), [schedules]);
  return availableScheduleIds;
}
