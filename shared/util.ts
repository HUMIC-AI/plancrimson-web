import {
  collection, getDocs, getFirestore, query, where,
} from 'firebase/firestore';
import {
  Semester, seasonOrder, UserData, Season,
} from './firestoreTypes';
import { ATTRIBUTE_DESCRIPTIONS, Class, Evaluation } from './apiTypes';
import seasPlan from './seasPlan.json';

export function getSemester(course: Class) {
  const season = /Fall/i.test(course.IS_SCL_DESCR_IS_SCL_DESCRH) ? 'Fall' : 'Spring' as const;
  const academicYear = parseInt(course.ACAD_YEAR, 10);
  const year = season === 'Fall' ? academicYear - 1 : academicYear;
  return { year, season };
}

export function classNames(...classes: (string | boolean)[]) {
  return classes.filter(Boolean).join(' ')
    .replace('hover-blue', 'shadow bg-blue-300 hover:bg-blue-500 transition-colors');
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

export function compareSemesters<T extends Semester>(a: T, b: T) {
  if (a.year !== b.year) return a.year - b.year;
  const seasonDiff = seasonOrder[a.season] - seasonOrder[b.season];
  if (seasonDiff !== 0) return seasonDiff;
  if ('id' in a && 'id' in b) {
    const { id: aId } = a as any;
    const { id: bId } = b as any;
    if (aId < bId) return -1;
    if (aId > bId) return 1;
  }
  return 0;
}

export function getUniqueSemesters(data: UserData) {
  const semesters = [] as { year: number, season: Season }[];
  Object.values(data.schedules).forEach(({ year, season }) => {
    // if this semester has not yet been added
    if (!semesters.find(({ year: y, season: s }) => year === y && season === s)) {
      semesters.push({ year, season });
    }
  });
  return semesters.sort(compareSemesters);
}

export function sortSchedules(schedules: UserData['schedules']) {
  return Object.values(schedules).sort(compareSemesters);
}

export function getSchedulesBySemester(data: UserData, targetYear: number, targetSeason: Season) {
  return sortSchedules(data.schedules).filter(({ year, season }) => year === targetYear && season === targetSeason);
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

export function adjustLabel(label: string) {
  if (label === '2222') return 'Spring';
  if (label === '2218') return 'Fall';
  return label;
}

export function adjustAttr(attr: string) {
  return ATTRIBUTE_DESCRIPTIONS[attr as keyof Class] || attr;
}

export async function getEvaluations(courseName: string) {
  const evaluations = await getDocs(query(
    collection(getFirestore(), 'evaluations'),
    where('courseName', '==', courseName),
  ));
  return evaluations.docs.map((doc) => doc.data() as Evaluation);
}

export function getEvaluationId(evaluation: Evaluation) {
  return [
    evaluation.courseName,
    evaluation.instructorName,
    evaluation.year,
    evaluation.season]
    .map((val) => val || 'UNKNOWN')
    .join('-')
    .replace(/[^a-zA-Z0-9]/g, '-');
}

export function getMeiliHost() {
  const host = process.env.NODE_ENV === 'production'
    ? process.env.NEXT_PUBLIC_MEILI_IP
    : 'http://127.0.0.1:7700';

  if (!host) {
    throw new Error('must configure the MEILI_IP environment variable');
  }

  return host;
}

export function getMeiliApiKey() {
  const key = process.env.NEXT_PUBLIC_MEILI_API_KEY;

  if (process.env.NODE_ENV === 'production' && !key) {
    throw new Error('must configure the MeiliSearch API key through the NEXT_PUBLIC_MEILI_API_KEY environment variable');
  }

  return key;
}

export function throwMissingContext<T>(): T {
  throw new Error('must provide context element');
}
