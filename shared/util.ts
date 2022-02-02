import {
  collection,
  getDocs,
  getFirestore,
  query,
  where,
} from 'firebase/firestore';
import {
  Semester,
  SEASON_ORDER,
  UserData,
  Season,
  ClassId,
  Schedule,
  DayOfWeek,
  DAYS_OF_WEEK,
  Viability,
} from './firestoreTypes';
import seasPlan from './seasPlan.json';
import { getSchoolYear } from '../src/requirements/util';
import type { ClassCache } from '../src/context/classCache';
import { Class, ATTRIBUTE_DESCRIPTIONS, Evaluation } from './apiTypes';

export const unsplashParams = '?utm_source=Plan+Crimson&utm_medium=referral';

type HasLabel = {
  label: string;
};

export function compareItems(a: HasLabel, b: HasLabel) {
  if (a.label < b.label) return -1;
  if (a.label > b.label) return 1;
  return 0;
}

export function compareWeekdays(a: HasLabel, b: HasLabel) {
  return (
    DAYS_OF_WEEK.indexOf(a.label as DayOfWeek)
    - DAYS_OF_WEEK.indexOf(b.label as DayOfWeek)
  );
}

export function getSemester(course: Class) {
  const season = course.STRM === '2222'
    ? 'Spring'
    : ((course.STRM === '2218'
      ? 'Fall'
      : course.IS_SCL_DESCR_IS_SCL_DESCRH) as Season);
  const academicYear = parseInt(course.ACAD_YEAR, 10);
  const year = season === 'Fall' ? academicYear - 1 : academicYear;
  return { year, season };
}

export function classNames(...classes: (string | boolean)[]) {
  return classes
    .filter(Boolean)
    .join(' ')
    .replace(
      'hover-blue',
      'shadow rounded bg-gray-800 hover:bg-opacity-50 text-white transition-colors',
    );
}

export function allTruthy<T>(list: T[]) {
  return list.filter(Boolean).map((val) => val!);
}

export function getClassId(course: Class): ClassId {
  return course.Key.replace(/[^a-zA-Z0-9-_]/g, '-');
}

export function getCourseName(course: Class) {
  return course.SUBJECT + course.CATALOG_NBR;
}

export function getNumCredits(course: Class) {
  return parseInt(course.HU_UNITS_MIN, 10);
}

export function compareSemesters(a: Semester, b: Semester) {
  if (a.year !== b.year) return a.year - b.year;
  const seasonDiff = SEASON_ORDER[a.season] - SEASON_ORDER[b.season];
  if (seasonDiff !== 0) return seasonDiff;
  if ('id' in a && 'id' in b) {
    const { id: aId } = a as any;
    const { id: bId } = b as any;
    if (aId < bId) return -1;
    if (aId > bId) return 1;
  }
  return 0;
}

export function getDefaultSemesters(classYear: number) {
  const schedules: Semester[] = [];

  for (let year = classYear - 4; year <= classYear; year += 1) {
    if (year > classYear - 4) {
      schedules.push({ year, season: 'Spring' });
    }
    if (year < classYear) {
      schedules.push({ year, season: 'Fall' });
    }
  }

  return schedules;
}

export function getUniqueSemesters(classYear: number, semesters: Semester[]) {
  const defaultSemesters = getDefaultSemesters(classYear);
  semesters.forEach(({ year, season }) => {
    // if this semester has not yet been added
    if (
      !defaultSemesters.find(
        ({ year: y, season: s }) => year === y && season === s,
      )
    ) {
      defaultSemesters.push({ year, season });
    }
  });
  return defaultSemesters.sort(compareSemesters);
}

export function sortSchedules(schedules: UserData['schedules']) {
  return Object.values(schedules).sort(compareSemesters);
}

export function getSchedulesBySemester(
  data: UserData,
  targetYear: number,
  targetSeason: Season,
) {
  return sortSchedules(data.schedules).filter(
    ({ year, season }) => year === targetYear && season === targetSeason,
  );
}

export function getAllClassIds(schedules: Schedule[]) {
  return schedules.flatMap((schedule) => schedule.classes.map((cls) => cls.classId));
}

type ViabilityResponse = {
  viability: Viability;
  reason: string;
  instructors?: { firstName: string; lastName: string }[];
};

function mapSome(val: string | string[], fn: (arg: string) => boolean) {
  return typeof val === 'string' ? fn(val) : val.some(fn);
}

function doesConflict(class1: Class, class2: Class) {
  return DAYS_OF_WEEK.some((day) => {
    if (
      // if neither class takes place on this day, continue
      !mapSome(class1.IS_SCL_MEETING_PAT, (str) => str.includes(day.slice(0, 2)))
      || !mapSome(class2.IS_SCL_MEETING_PAT, (str) => str.includes(day.slice(0, 2)))
    ) {
      return false;
    }
    // a little bit gross, to handle since each field can be a string or an array of strings
    return mapSome(class1.IS_SCL_STRT_TM_DEC, (st1) => mapSome(class1.IS_SCL_END_TM_DEC, (end1) => mapSome(class2.IS_SCL_STRT_TM_DEC, (st2) => mapSome(class2.IS_SCL_END_TM_DEC, (end2) => {
      const [s1, e1, s2, e2] = [st1, end1, st2, end2].map(parseFloat);
      if (e1 < s2 || s1 > e2) return false;
      return true;
    }))));
  });
}

export function findConflicts(classes: Class[]): Record<ClassId, ClassId[]> {
  const conflicts: Record<ClassId, ClassId[]> = {};
  classes.forEach((cls) => {
    conflicts[getClassId(cls)] = [];
  });

  classes.forEach((cls, i) => {
    classes.slice(i + 1).forEach((other) => {
      if (doesConflict(cls, other)) {
        const [id1, id2] = [cls, other].map(getClassId);
        conflicts[id1].push(id2);
        conflicts[id2].push(id1);
      }
    });
  });

  return conflicts;
}

export function checkViable(
  cls: Class,
  querySemester: Semester,
  data: UserData,
  classCache: ClassCache,
): ViabilityResponse {
  const { year, season } = getSemester(cls);

  const selectedSchedule = data.selectedSchedules[`${querySemester.year}${querySemester.season}`];
  if (selectedSchedule && data.schedules[selectedSchedule]) {
    const conflicts = findConflicts(allTruthy([
      cls,
      ...data.schedules[selectedSchedule].classes.map(
        ({ classId }) => classCache[classId],
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

  if (year === querySemester.year && season === querySemester.season) {
    return {
      viability: 'Yes',
      reason: `This course is offered in ${querySemester.season} ${querySemester.year} in my.harvard.`,
    };
  }

  if (
    cls.SUBJECT === 'FRSEMR'
    && getSchoolYear(querySemester, data.classYear) > 1
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
          && querySemester.season === 'Spring'
          && plannedSemester.academicYear + 1 === querySemester.year)
        || (plannedSemester.term === 'Fall'
          && querySemester.season === 'Fall'
          && plannedSemester.academicYear === querySemester.year),
    );

    if (matchesSemester?.offeredStatus === 'No') {
      return {
        viability: 'No',
        reason: `This course will not be offered in ${querySemester.season} ${querySemester.year} according to the SEAS Four Year Plan.`,
      };
    }

    if (matchesSemester?.offeredStatus === 'Yes') {
      return {
        viability: 'Yes',
        reason: `This course will be offered in ${querySemester.season} ${querySemester.year} according to the SEAS Four Year Plan.`,
        instructors: matchesSemester.instructors,
      };
    }

    return {
      viability: 'Unlikely',
      reason: `${querySemester.season} ${querySemester.year} is not listed in this course's offerings in the SEAS Four Year Plan.`,
    };
  }

  if (season === querySemester.season) {
    return {
      viability: 'Likely',
      reason: `This course is usually offered in the ${querySemester.season.toLowerCase()}.`,
    };
  }

  return {
    viability: 'Unlikely',
    reason: `This course is not usually offered in the ${querySemester.season.toLowerCase()}.`,
  };
}

export function termNumberToSeason(label: string) {
  if (label === '2222') return 'Spring';
  if (label === '2218') return 'Fall';
  return label;
}

export function adjustAttr(attr: string) {
  return ATTRIBUTE_DESCRIPTIONS[attr as keyof Class] || attr;
}

export async function getEvaluations(courseName: string) {
  const evaluations = await getDocs(
    query(
      collection(getFirestore(), 'evaluations'),
      where('courseName', '==', courseName),
    ),
  );
  return evaluations.docs.map((doc) => doc.data() as Evaluation);
}

/**
 * This CANNOT be modified since existing evaluations are already mapped
 * according to this function.
 * @returns the unique Firestore-valid ID of an evaluation based on
 * the course name, instructor name, year, and season
 */
export function getEvaluationId(evaluation: Evaluation) {
  return [
    evaluation.courseName,
    evaluation.instructorName,
    evaluation.year,
    evaluation.season,
  ]
    .map((val) => val || 'UNKNOWN')
    .join('-')
    .replace(/[^a-zA-Z0-9]/g, '-');
}

export function getMeiliHost() {
  const host = process.env.NODE_ENV === 'production'
    ? process.env.NEXT_PUBLIC_MEILI_IP
    : (process.env.NEXT_PUBLIC_DEV_MEILI_IP || 'http://127.0.0.1:7700');

  if (!host) {
    throw new Error('must configure the MEILI_IP environment variable');
  }

  return host;
}

export function getMeiliApiKey() {
  const key = process.env.NEXT_PUBLIC_MEILI_API_KEY;

  if (process.env.NODE_ENV === 'production' && !key) {
    throw new Error(
      'must configure the MeiliSearch API key through the NEXT_PUBLIC_MEILI_API_KEY environment variable',
    );
  }

  return key;
}

export function throwMissingContext<T>(): T {
  throw new Error('must provide context element');
}
