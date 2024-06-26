import {
  Class, getSemester, findConflicts, allTruthy, getClassId, seasPlan,
} from '@/src/lib';
import { useMemo } from 'react';
import { getSchoolYear } from './requirements/util';
import { BaseSchedule, Viability } from './types';
import { getClassIdsOfSchedule } from './features/schedules';
import { useAppSelector } from './utils/hooks';
import { ClassCache, selectClassCache } from './features/classCache';

type ViabilityResponse = {
  viability: Viability;
  reason: string;
  instructors?: { firstName: string; lastName: string }[];
};

/**
 * Check if it is viable for a given user to take a given class during a given semester.
 * @param cls The class to be added.
 * @param schedule the schedule to add it to.
 * @param classYear the user's graduation year
 * @param classCache A map from class uids to objects.
 * @returns a tuple containing the viability and the reason.
 */
export function checkViable({
  cls, schedule, classYear, classCache,
}: {
  cls: Class,
  schedule: BaseSchedule,
  classYear: number,
  classCache: ClassCache,
}): ViabilityResponse {
  const { year, season } = getSemester(cls);

  if (schedule) {
    const conflicts = findConflicts(allTruthy([
      cls,
      ...getClassIdsOfSchedule(schedule).map(
        (classId) => classCache[classId],
      ),
    ]));

    const classConflicts = conflicts[getClassId(cls)];
    if (classConflicts && classConflicts.length > 0) {
      return {
        viability: 'Unlikely',
        reason: `This course conflicts with these courses in your schedule: ${classConflicts
          .map((id) => classCache[id].SUBJECT + classCache[id].CATALOG_NBR)
          .join(', ')}.`,
      };
    }
  }

  if (year === schedule.year && season === schedule.season) {
    return {
      viability: 'Yes',
      reason: `This course is offered in ${schedule.season} ${schedule.year} in my.harvard.`,
    };
  }

  if (
    cls.SUBJECT === 'FRSEMR'
      && classYear
      && getSchoolYear(schedule, classYear) > 1
  ) {
    return {
      viability: 'No',
      reason: 'Freshman Seminars can only be taken in the first year.',
    };
  }

  // check the SEAS plan
  const searchSubjects = allTruthy([
    cls.SUBJECT,
    cls.HU_ALIAS,
    ...(Array.isArray(cls.ACAD_ORG) ? cls.ACAD_ORG : [cls.ACAD_ORG]),
  ]);
  const catalogNumberRegExp = new RegExp(cls.CATALOG_NBR.trim(), 'i');
  const foundInSeasPlan = seasPlan.find(
    ({ prefix, courseNumber }) => searchSubjects.includes(prefix.replace('AC', 'APCOMP'))
        && catalogNumberRegExp.test(courseNumber),
  );

  if (foundInSeasPlan) {
    const matchesSemester = foundInSeasPlan.semesters.find(
      (plannedSemester) => (plannedSemester.term === 'Spring'
          && schedule.season === 'Spring'
          && plannedSemester.academicYear + 1 === schedule.year)
          || (plannedSemester.term === 'Fall'
            && schedule.season === 'Fall'
            && plannedSemester.academicYear === schedule.year),
    );

    if (matchesSemester?.offeredStatus === 'No') {
      return {
        viability: 'No',
        reason: `This course will not be offered in ${schedule.season} ${schedule.year} according to the SEAS Four Year Plan.`,
      };
    }

    if (matchesSemester?.offeredStatus === 'Yes') {
      return {
        viability: 'Yes',
        reason: `This course will be offered in ${schedule.season} ${schedule.year} according to the SEAS Four Year Plan.`,
        instructors: matchesSemester.instructors,
      };
    }

    return {
      viability: 'Unlikely',
      reason: `${schedule.season} ${schedule.year} is not listed in this course's offerings in the SEAS Four Year Plan.`,
    };
  }

  if (season === schedule.season) {
    return {
      viability: 'Likely',
      reason: `This course is usually offered in the ${schedule.season.toLowerCase()}.`,
    };
  }

  return {
    viability: 'Unlikely',
    reason: `This course is not usually offered in the ${schedule.season.toLowerCase()}.`,
  };
}

export function useConflicts(schedule: BaseSchedule | null) {
  const classCache = useAppSelector(selectClassCache);
  const conflicts = useMemo<Record<string, string[]> | null>(() => {
    if (!schedule) return null;
    if (!schedule.classes) return {};
    const classes = schedule.classes.map((classId) => classCache[classId]);
    return findConflicts(allTruthy(classes));
  }, [schedule, classCache]);
  return conflicts;
}
