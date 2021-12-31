import {
  Semester, seasonOrder, UserData, Season,
} from './firestoreTypes';
import { Class } from './apiTypes';
import seasPlan from './seasPlan.json';

export function getSemester(course: Class) {
  const season = /Fall/i.test(course.IS_SCL_DESCR_IS_SCL_DESCRH) ? 'Fall' : 'Spring' as const;
  const academicYear = parseInt(course.ACAD_YEAR, 10);
  const year = season === 'Fall' ? academicYear - 1 : academicYear;
  return { year, season };
}

export function classNames(...classes: (string | boolean)[]) {
  return classes.filter(Boolean).join(' ');
}

export function allTruthy<T>(list: T[]) {
  return list.filter(Boolean).map((val) => val!);
}

export function getClassId(course: Class) {
  return course.Key.replace(/[^a-zA-Z0-9-_]/g, '-');
}

export function getNumCredits(course: Class) {
  return parseInt(course.HU_UNITS_MIN, 10);
}

export function compareSemesters(a: Semester, b: Semester) {
  if (a.year !== b.year) return a.year - b.year;
  const seasonDiff = seasonOrder[a.season] - seasonOrder[b.season];
  return seasonDiff;
}

export function getAllSemesters(data: UserData) {
  const semesters = [] as { year: number, season: Season }[];
  Object.values(data.schedules).forEach(({ year, season }) => {
    // if this semester has not yet been added
    if (!semesters.find(({ year: y, season: s }) => year === y && season === s)) {
      semesters.push({ year, season });
    }
  });
  return semesters.sort(compareSemesters);
}

export function getSchedulesBySemester(data: UserData, targetYear: number, targetSeason: Season) {
  return Object.values(data.schedules).filter(({ year, season }) => year === targetYear && season === targetSeason);
}

export function getAllClassIds(data: UserData) {
  return Object.values(data.schedules).flatMap((schedule) => schedule.classes.map((cls) => cls.classId));
}

export function checkViable(cls: Class, semester: Semester) {
  // if it is in this semester
  if (getSemester(cls).year === semester.year && getSemester(cls).season === semester.season) {
    return true;
  }

  if (!cls.HU_ALIAS) return false;

  // todo
  const subjectRegExp = new RegExp(allTruthy([cls.HU_ALIAS, cls.SUBJECT]).join('|'), 'i');
  const catalogNumberRegExp = new RegExp(cls.CATALOG_NBR.trim(), 'i');
  if (seasPlan.find((planEntry) => {
    const [subject, number] = planEntry.courseNumber.split(' ');
    const subjectMatches = (subject === 'AC' && cls.ACAD_ORG === 'COMPSE')
                           || subjectRegExp.test(subject);
    // trim leading zeros
    const numberMatches = catalogNumberRegExp.test(number.replace(/^0+/g, ''));
    if (subjectMatches && numberMatches) return true;
    return false;
  })) {
    return true;
  }

  return false;
}
