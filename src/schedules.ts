import { useEffect, useState } from 'react';
import { Class } from '../shared/apiTypes';
import fetcher from '../shared/fetcher';
import { FAILING_GRADES, Schedule, UserData } from './firestoreTypes';
import { getClassId } from './userContext';

// want to query for all people planning to take this class at a certain time
// user

export function fetchClass(classKey: string) {
  return fetcher({
    url: '/api/getClass',
    method: 'get',
    params: { classKey, updateDb: true },
  });
}

type ClassCache = Record<string, Class>;

export function useClassCache(classNumbers: Array<string>) {
  const [classCache, setClassCache] = useState<ClassCache>({});
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

/**
 * Only works for users on a typical four-year schedule.
 * @param schedule the schedule to see which school year it is part of
 * @param classYear the user's graduation year
 * @returns school year, e.g. 1 for freshman, ..., 4 for senior
 */
function getSchoolYear(schedule: Schedule, classYear: number) {
  let ret = schedule.year;
  if (schedule.season === 'Fall') ret += 1;
  return ret - classYear + 4;
}

type Requirement<Accumulator = number> = {
  id: string;
  description: string;
  validate: (value: Accumulator) => boolean;
  initialValue?: Accumulator

  // should return null to indicate no change
  reducer: (prev: Accumulator, cls: Class, schedule: Schedule, userData: UserData) => Accumulator | null;
};

const genedRequirement = (id: string, targetType: Class['IS_SCL_DESCR100_HU_SCL_ATTR_GE']) => ({
  id,
  description: `${targetType} General Education Requirement`,
  validate: (count) => count > 0,
  reducer: (prev, cls) => {
    // TODO check pass/fail case
    const genedType = cls.IS_SCL_DESCR100_HU_SCL_ATTR_GE;
    if (genedType === targetType) return prev + 1;
    return null;
  },
}) as Requirement;

const divisionalDistribution = (id: string, targetType: Class['IS_SCL_DESCR100_HU_SCL_ATTR_LDD']) => ({
  id,
  description: `${targetType} Divisional Distribution Requirement`,
  validate: (count) => count > 0,
  reducer: (prev, cls) => {
    // TODO check pass/fail case
    const ldd = cls.IS_SCL_DESCR100_HU_SCL_ATTR_LDD;
    if (ldd === targetType) return prev + 1;
    return null;
  },
}) as Requirement;

const scheduleRequirements = [
  {
    id: 'totalCredits',
    description: 'All candidates for the A.B. or the S.B. degree must pass 128 credits (the equivalent of 32 4-credit courses) (9)',
    validate: (count) => count >= 128,
    reducer: (prev, cls, schedule, userData) => {
      // TODO handle advanced standing, etc
      const takenClass = userData.schedules[schedule.id].classes
        .find((classTaken) => classTaken.classId === getClassId(cls));
      if (takenClass && FAILING_GRADES.includes(takenClass.grade!)) {
        return null;
      }
      return prev + parseInt(cls.HU_UNITS_MIN, 10);
    },
  },
  {
    id: 'grades',
    description: `...and receive letter grades of C– or higher in at least 84 of those credits... The only non-letter grade that counts toward the requirement
    of 84 satisfactory letter-graded credits is Satisfactory (SAT); only one (8-credit) senior tutorial
    course graded Satisfactory may be so counted',
    Credits taken either by cross-registration or
    out of residence for degree credit will not be counted toward the letter-graded credit requirement
    unless they are applied toward concentration requirements or the requirements for the
    Undergraduate Teacher Education Program (UTEP) (9)`,
    validate: (count) => count >= 84,
    reducer: (prev, cls) => {
      const numCredits = parseInt(cls.HU_UNITS_MIN, 10);
      if (cls.IS_SCL_DESCR100_HU_SCL_GRADE_BASIS === 'FAS Letter Graded') return prev + numCredits;
      if (cls.SSR_COMPONENTDESCR === 'Tutorial' && cls.IS_SCL_DESCR100_HU_SCL_GRADE_BASIS === 'FAS Satisfactory/Unsatisfactory') {
        return prev + numCredits;
      }
      return null;
    },
  },
  {
    id: 'coursesBeforeDoneSophomore',
    description: 'Forty-eight of the required 84 letter-graded credits should be completed by the end of sophomore year (9)',
    validate: (count) => count >= 48,
    reducer: (prev, _, schedule, userData) => {
      // courses that are taken by the end of sophomore year
      const schoolYear = getSchoolYear(schedule, userData.classYear);
      if (schoolYear <= 2) return prev + 1;
      return null;
    },
  },
  {
    id: 'freshmanFall',
    description: 'First-year students who wish to complete fewer than 16 credits per term must obtain the approval of their Resident Dean (9)',
    validate: (count) => count >= 16,
    reducer: (prev, _, schedule, userData) => {
      if (getSchoolYear(schedule, userData.classYear) === 1) return prev + 1;
      return null;
    },
  },
  {
    id: 'letterGradedCourses',
    description: 'Ordinarily, no first-year student or sophomore may take fewer than three letter-graded courses (4 credits per course) in any term (9)',
    validate: (count) => count >= 3,
    reducer: (prev, cls, schedule, userData) => {
      if (getSchoolYear(schedule, userData.classYear) > 2) return null;
      if (cls.IS_SCL_DESCR100_HU_SCL_GRADE_BASIS === 'FAS Letter Graded') return prev + 1;
      return null;
    },
  },

  // No student will be recommended for the A.B. or the S.B. degree who has not completed a
  // minimum of four regular terms in the College as a candidate for that degree and passed at
  // least 64 credits during regular terms in Harvard College. (9)

  // GENERAL EDUCATION REQUIREMENT

  // Students graduating in May 2020 or later must complete four General Education courses, one
  // from each of the following four General Education categories:
  // Aesthetics & Culture
  // Ethics & Civics
  // Histories, Societies, Individuals
  // Science & Technology in Society

  // Three of these courses must be letter-graded. One may be taken pass/fail, with the permission
  // of the instructor. However, if that same course is being used to fulfill a concentration or
  // secondary field requirement, there may be limitations on pass/fail options. (9)`,

  genedRequirement('genedAestheticsAndCulture', 'Aesthetics and Culture'),
  genedRequirement('genedEthicsAndCivics', 'Ethics and Civics'),
  genedRequirement('genedHSI', 'Histories, Societies, Individuals'),
  genedRequirement('genedSTS', 'Science and Technology in Society'),

  // All students must complete one departmental (non-Gen Ed) course in each of the three main
  // divisions of the FAS and the John A. Paulson School of Engineering and Applied Sciences
  // (SEAS):
  // Arts and Humanities
  // Social Sciences
  // Science and Engineering and Applied Sciences
  // Courses used to fulfill the distribution requirement may be taken pass/fail with the permission of
  // the instructor. However, when the same courses are being used to fulfill a concentration or
  // secondary field requirement, there may be limitations on pass/fail options.
  // All courses in every division will count toward the distribution requirement except elementaryand intermediate-level languages, some graduate courses, courses in Expository Writing, music
  // performance courses, Freshman Seminars, and House Seminars.
  // A course taken to fulfill a Divisional Distribution requirement cannot be counted toward the
  // College’s Quantitative Reasoning with Data (QRD) requirement.
  // There are no constraints regarding the timing of these courses, as long as all are completed by
  // graduation.
  // Transfer students may fulfill the distribution requirement with courses taken at their previous
  // undergraduate institution. Courses taken during term time or summer study abroad, and
  // courses taken at Harvard Summer School may also count for the distribution requirement.
  // For questions, students should contact divdist@fas.harvard.edu. (13)
  divisionalDistribution('distributionArtsAndHumanities', 'Arts and Humanities'),
  divisionalDistribution('distributionSEAS', 'Science & Engineering & Applied Science'),
] as Array<Requirement>;

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

export const validateSchedule = (schedule: Schedule, userData: UserData, classCache: ClassCache) => {
  const requirementsMet = {} as Record<string, any>;
  const classesUsed = {} as Record<string, string[]>;

  scheduleRequirements.forEach((req) => {
    requirementsMet[req.id] = req.initialValue;
    classesUsed[req.id] = [];
  });

  schedule.classes.reduce((acc, cls) => {
    const next = {} as Record<string, any>;
    scheduleRequirements.forEach((req) => {
      const newValue = req.reducer(Object.freeze(acc[req.id]), classCache[cls.classId], schedule, userData);
      if (newValue !== null) {
        next[req.id] = newValue;
        classesUsed[req.id].push(cls.classId);
      } else {
        next[req.id] = acc[req.id];
      }
    });
    return next;
  }, requirementsMet);

  return [requirementsMet, classesUsed];
};
