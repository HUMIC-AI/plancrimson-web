import { User } from 'firebase/auth';
import { doc, getFirestore, DocumentReference } from 'firebase/firestore';
import { Class } from '../shared/apiTypes';
import fetcher from '../shared/fetcher';
import {
  Season, seasonOrder, Semester, UserData,
} from './firestoreTypes';

export function classNames(...classes: (string | boolean)[]) {
  return classes.filter(Boolean).join(' ');
}

export function getClassId(course: Class) { return course.HU_STRM_CLASSNBR; }

export function getUserRef({ uid }: User) {
  return doc(getFirestore(), `users/${uid}`) as DocumentReference<UserData>;
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

export function fetchClass(classKey: string) {
  return fetcher({
    url: '/api/getClass',
    method: 'get',
    params: { classKey, updateDb: true },
  });
}
