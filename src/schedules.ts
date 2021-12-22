import { useEffect, useState } from 'react';
import ClassIndex from 'shared/meilisearch';
import { Class } from './types';

// want to query for all people planning to take this class at a certain time
// user

export type Season = 'Winter' | 'Spring' | 'Summer' | 'Fall';

// see https://infoforfaculty.fas.harvard.edu/book/grading-system
const grade = {
  A: '',
  'A-': '',
  'B+': '',
  B: '',
  'B-': '',
  'C+': '',
  C: '',
  'C-': '',
  'D+': '',
  D: '',
  'D-': '',
  E: '',
  ABS: '',
  EXL: '',
  EXT: '',
  PA: 'Pass', // A to D-
  FL: 'Fail',
  SAT: 'Satisfactory', // A to C-
  UNSAT: 'Unsatisfactory',
} as const;

export type UserClassData = {
  id: string;
  grade?: keyof typeof grade;
};

export function fetchClass(classKey: string) {
  return ClassIndex.getDocument(classKey);
}

export function useClassCache(classNumbers: Array<string>) {
  const [classCache, setClassCache] = useState<Record<string, Class>>({});
  const [fetchClassError, setFetchClassError] = useState<any[] | undefined>();

  useEffect(() => {
    Promise.allSettled(classNumbers.map(async (number) => {
      if (classCache[number]) {
        return { [number]: classCache[number] };
      }
      return { [number]: await fetchClass(number) };
    }))
      .then((results) => {
        const fulfilled = results.filter((result) => result.status === 'fulfilled');
        setClassCache(Object.assign({}, ...fulfilled.map((result) => result.status === 'fulfilled' && result.value)));
        const rejected = results.filter((result) => result.status === 'rejected');
        setFetchClassError(rejected.map((result) => result.status === 'rejected' && result.reason));
      })
      .catch((err) => setFetchClassError(err));
  }, [classNumbers]);

  return { classCache, fetchClassError };
}

// type Requirement = {
//   id: string;
//   description: string;
//   verify: (schedule: Schedule, major: string) => { valid: boolean, message?: string }
// };

// function timeToSemester(schedule: Schedule, gradYear: number, year: number, season: number) {
//   return 0;
// }

// const scheduleRequirements = [
//   {
//     id: 'credits',
//     description: 'All candidates for the A.B. or the S.B. degree must pass 128 credits (the equivalent of 32 4-credit courses)',
//     verify(schedule) {
//       const numCredits = schedule.reduce((acc, { classKey }) => acc + parseInt(getCourse(classKey).HU_UNITS_MIN, 10), 0);
//       if (numCredits >= 128) return { valid: true };
//       return { valid: false, message: this.description };
//     },
//   },
//   {
//     id: 'minCourses',
//     description: `Forty-eight of the required 84 letter-graded credits should be completed by the end of
//                   sophomore year. Ordinarily, no first-year student or sophomore may take fewer than three
//                   letter-graded courses (4 credits per course) in any term. First-year students who wish to
//                   complete fewer than 16 credits per term must obtain the approval of their Resident Dean.`,
//     verify(schedule) {
//       const numCreditsBySophomore = schedule.reduce((acc, { year, season, course }) => acc
//       + (timeToSemester(2025, year, season === 'Fall' ? 0 : 1) < 4 ? parseInt(getCourse(course).HU_UNITS_MIN, 10) : 0), 0);
//       if (numCreditsBySophomore >= 48) return { valid: true };
//       return { valid: false, message: this.description };
//     },
//   },
// //   {
// //     id: 'grades',
// //     description: '...and receive letter grades of C– or higher in at least 84 of those credits... The only non-letter grade that counts toward the requirement
// // of 84 satisfactory letter-graded credits is Satisfactory (SAT); only one (8-credit) senior tutorial
// // course graded Satisfactory may be so counted',
// // Credits taken either by cross-registration or
// // out of residence for degree credit will not be counted toward the letter-graded credit requirement
// // unless they are applied toward concentration requirements or the requirements for the
// // Undergraduate Teacher Education Program (UTEP)
// //     verify(schedule) {
// //       const numCredits = schedule.reduce((acc, { course }) => acc + parseInt(getCourse(course).HU_UNITS_MIN, 10), 0);
// //       if (numCredits >= 128) return { valid: true };
// //       return { valid: false, message: this.description };
// //     },
// //   },
// ] as Array<Requirement>;

// const honoursRequirements = [
//   {
//     id: 'credits',
//     description: `...and receive letter grades of C– or higher in at least 84 of those credits (at
//                       least 96 credits to be eligible for a degree with honors).`,
//     verify(schedule) {
//       return { valid: false };
//     },
//   },
// ] as Array<Requirement>;

// export default [scheduleRequirements, honoursRequirements];
