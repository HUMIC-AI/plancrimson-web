import {
  collection, getDocs, getFirestore, query, where,
} from 'firebase/firestore';
import {
  Semester, seasonOrder, UserData, Season,
} from './firestoreTypes';
import {
  ATTRIBUTE_DESCRIPTIONS, Class, Evaluation, Viability,
} from './apiTypes';
import seasPlan from './seasPlan.json';
import { getSchoolYear } from '../src/requirements/util';

export function getSemester(course: Class) {
  const season = course.STRM === '2222'
    ? 'Spring'
    : (course.STRM === '2218'
      ? 'Fall'
      : course.IS_SCL_DESCR_IS_SCL_DESCRH) as Season;
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

export function compareSemesters(a: Semester<string | number>, b: Semester<string | number>) {
  const aYear = parseInt(a.year as string, 10);
  const bYear = parseInt(b.year as string, 10);
  if (aYear !== bYear) return aYear - bYear;
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

export function getUniqueSemesters(data: UserData) {
  const semesters = getDefaultSemesters(data.classYear);
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

export function checkViable(cls: Class, semester: Semester, data: UserData): {
  viability: Viability;
  reason: string;
  instructors?: { firstName: string; lastName: string; }[];
} {
  const { year, season } = getSemester(cls);

  if (year === semester.year && season === semester.season) {
    return {
      viability: 'Yes',
      reason: 'This course is offered this semester.',
    };
  }

  if (cls.SUBJECT === 'FRSEMR' && getSchoolYear(semester, data.classYear) > 1) {
    return {
      viability: 'No',
      reason: 'Freshman Seminars can only be taken in the first year.',
    };
  }

  // check the SEAS plan
  const searchSubjects = allTruthy([cls.SUBJECT, cls.HU_ALIAS, ...(Array.isArray(cls.ACAD_ORG) ? cls.ACAD_ORG : [cls.ACAD_ORG])]);
  const catalogNumberRegExp = new RegExp(cls.CATALOG_NBR.trim(), 'i');
  const foundInSeasPlan = seasPlan.find(({ prefix, courseNumber }) => (
    searchSubjects.includes(prefix.replace('AC', 'APCOMP'))
    && catalogNumberRegExp.test(courseNumber)
  ));

  if (foundInSeasPlan) {
    const matchesSemester = foundInSeasPlan.semesters.find((plannedSemester) => (
      (
        plannedSemester.term === 'Spring'
        && semester.season === 'Spring'
        && plannedSemester.academicYear + 1 === semester.year
      ) || (
        plannedSemester.term === 'Fall'
        && semester.season === 'Fall'
        && plannedSemester.academicYear === semester.year
      )
    ));

    if (matchesSemester?.offeredStatus === 'No') {
      return {
        viability: 'No',
        reason: 'This course will not be offered this semester according to the SEAS Four Year Plan.',
      };
    }

    if (matchesSemester?.offeredStatus === 'Yes') {
      return {
        viability: 'Yes',
        reason: 'This course is in the SEAS Four Year Plan.',
        instructors: matchesSemester.instructors,
      };
    }

    return {
      viability: 'Unlikely',
      reason: 'This semester is not listed in this course\'s offerings in the SEAS Four Year Plan.',
    };
  }

  if (season === semester.season) {
    return {
      viability: 'Likely',
      reason: `This course is usually offered in the ${season.toLowerCase()}.`,
    };
  }

  return {
    viability: 'Unlikely',
    reason: 'This course is not usually offered in this term.',
  };
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
