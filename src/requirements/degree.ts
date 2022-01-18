import { getClassId, getNumCredits } from '../../shared/util';
import { FAILING_GRADES, PASSING_GRADES } from '../../shared/firestoreTypes';
import { getSchoolYear, Requirement, RequirementGroup } from './util';

const totalCredits: Requirement = {
  id: 'Total credits',
  description:
    'All candidates for the A.B. or the S.B. degree must pass 128 credits (the equivalent of 32 4-credit courses).',
  sourcePage: 9,
  validate: (count) => count >= 128,
  reducer: (prev, cls, schedule, userData) => {
    // TODO handle advanced standing, etc
    const takenClass = userData.schedules[schedule.id].classes.find(
      (classTaken) => classTaken.classId === getClassId(cls),
    );
    if (
      takenClass
      && (FAILING_GRADES as readonly string[]).includes(takenClass.grade!)
    ) {
      return null;
    }
    return prev + parseInt(cls.HU_UNITS_MIN, 10);
  },
};

const grades: Requirement = {
  id: 'Grades',
  description: `All candidates must receive letter grades of C– or higher in at least 84 credits. The only non-letter grade that counts toward the requirement of 84 satisfactory letter-graded credits is Satisfactory (SAT); only one (8-credit) senior tutorial course graded Satisfactory may be so counted.
  Credits taken either by cross-registration or out of residence for degree credit will not be counted toward the letter-graded credit requirement unless they are applied toward concentration requirements or the requirements for the Undergraduate Teacher Education Program (UTEP)`,
  sourcePage: 9,
  validate: (count) => count >= 84,
  reducer: (prev, cls, schedule) => {
    const grade = schedule.classes.find(
      (userCls) => userCls.classId === getClassId(cls),
    )?.grade;

    // if (cross-registration || out of residence) {
    // if (countsForConcentration || countsForUtep(cls))
    // return prev + getNumCredits(cls)
    // else return null
    // }

    if (cls.IS_SCL_DESCR100_HU_SCL_GRADE_BASIS === 'FAS Letter Graded') {
      if (!grade) return prev + getNumCredits(cls);
      const failingGrades = FAILING_GRADES as readonly string[];
      const passingGrades = PASSING_GRADES as readonly string[];
      if (
        failingGrades.includes(grade!)
        || passingGrades.indexOf(grade!) > passingGrades.indexOf('C-')
      ) {
        return null;
      }
      return prev + getNumCredits(cls);
    }
    if (
      cls.SSR_COMPONENTDESCR === 'Tutorial'
      && cls.IS_SCL_DESCR100_HU_SCL_GRADE_BASIS
        === 'FAS Satisfactory/Unsatisfactory'
    ) {
      if (grade === 'SAT') return prev + getNumCredits(cls);
      return null;
    }
    return null;
  },
};

const halfway: Requirement = {
  id: 'Halfway letter-graded courseload',
  description:
    'Forty-eight of the required 84 letter-graded credits should be completed by the end of sophomore year.',
  sourcePage: 9,
  validate: (count) => count >= 48,
  reducer: (prev, cls, schedule, userData) => {
    // courses that are taken by the end of sophomore year
    const schoolYear = getSchoolYear(schedule, userData.classYear);
    if (schoolYear <= 2) return prev + getNumCredits(cls);
    return null;
  },
};

const firstYear: Requirement = {
  id: 'First-year minimum courseload',
  // ie first years need to complete at least 16 credits per term
  description:
    'First-year students who wish to complete fewer than 16 credits per term must obtain the approval of their Resident Dean.',
  sourcePage: 9,
  validate: (count) => count >= 16,
  reducer: (prev, cls, schedule, userData) => {
    if (getSchoolYear(schedule, userData.classYear) === 1) return prev + getNumCredits(cls);
    return null;
  },
};

const letterMinimum: Requirement = {
  id: 'Minimum letter-graded courseload',
  description:
    'Ordinarily, no first-year student or sophomore may take fewer than three letter-graded courses (4 credits per course) in any term. First-year students who wish to complete fewer than 16 credits per term must obtain the approval of their Resident Dean.',
  sourcePage: 9,
  validate: (count) => count >= 3,
  reducer: (prev, cls, schedule, userData) => {
    if (
      getSchoolYear(schedule, userData.classYear) <= 2
      && cls.IS_SCL_DESCR100_HU_SCL_GRADE_BASIS === 'FAS Letter Graded'
    ) return prev + 1;
    return null;
  },
};

const exceptions: Requirement = {
  id: 'Exceptional cases',
  description:
    'Advanced Standing students graduating in six semesters, students studying abroad for two semesters (fall and spring), and sophomore transfer students (32 credits granted) must pass 96 credits at Harvard and receive letter grades of C– or higher in at least 60 of them (at least 72 to be eligible for a degree with honors). (See “Advanced Standing”). Advanced Standing students graduating in seven semesters and students studying abroad for one semester (fall or spring) must pass 112 credits at Harvard and receive letter grades of C– or higher in at least 72 of them (at least 84 to be eligible for a degree with honors). Junior transfer students (64 credits granted) must pass 64 credits at Harvard and receive letter grades of C– or higher in at least 40 of them (at least 48 to be eligible for a degree with honors). The precise number of letter-graded credits with C– or higher required of transfer students will be subject to evaluation at the time of matriculation at Harvard.',
  sourcePage: 9,
  reducer: () => null,
};

const creditRequirement: RequirementGroup = {
  groupId: 'Credit requirements',
  sourcePage: 9,
  requirements: [
    totalCredits,
    grades,
    halfway,
    firstYear,
    letterMinimum,
    exceptions,
  ],
};

const residencyRequirement: RequirementGroup = {
  groupId: 'Residency requirement',
  sourcePage: 10,
  requirements: [
    {
      id: 'Terms in residence',
      description:
        'Students will not ordinarily be recommended for the A.B. or S.B. degree without having paid for eight terms of residence. (Any student currently registered in the College is considered to be “in residence,” regardless of actual domicile.) Exceptions to the residency requirements are made for students who graduate in fewer than eight terms by exercising Advanced Standing or who matriculated with transfer credit. Some students may complete Harvard degree requirements in fewer than eight terms as a result of course work done elsewhere that is approved in advance and counted by Harvard toward degree requirements (see “Requirements for the Degree”), or as a result of course work done at the Harvard Summer School (see “Harvard Summer School”), or as a result of having worked at a rate of more than 16 credits per term.',
      sourcePage: 10,
      reducer: () => null,
    },
    {
      id: 'Minimum regular terms',
      description:
        'No student will be recommended for the A.B. or the S.B. degree who has not completed a minimum of four regular terms in the College as a candidate for that degree and passed at least 64 credits during regular terms in Harvard College.',
      sourcePage: 10,
      reducer: () => null,
    },
    {
      id: '"Lost degree" candidates',
      description:
        'Students who have not completed the degree requirements within the allotted number of terms (“lost degree” candidates) may complete degree requirements only by enrolling in the Harvard Summer School, by successfully petitioning the Administrative Board for an additional term (see “Additional Term”), or, if eligible, by enrolling in a program of study approved by the Committee on Education Abroad (see “Study Abroad”).',
      sourcePage: 10,
      reducer: () => null,
    },
  ],
};

const fasDescription = 'The Faculty of Arts and Sciences (FAS) offers undergraduates a wide range of courses to satisfy individual objectives and interests. In defining the requirements for the Bachelor of Arts (A.B.) and Bachelor of Science (S.B.) degrees, the Faculty has sought to accommodate those objectives and interests, and, at the same time, to establish a framework for study in the College that ensures involvement with important areas of general knowledge (the General Education requirements) and in-depth study of one specific area (the concentration requirement). In addition, students must demonstrate competence in certain skills reflective of the complex demands of modern society (writing, quantitative reasoning with data, and facility with a language other than English) and achieve a satisfactory level of performance in their work. Each of these requirements is set forth in detail below. (For the S.B. degree requirements, see “Engineering Sciences,” in Fields of Concentration, https://handbook.college.harvard.edu/#fields.) Students are responsible for knowing the rules that apply to their candidacy for the A.B. or S.B. degree.';

const fasRequirements: RequirementGroup = {
  groupId: 'Requirements for the A.B. or S.B. Degrees',
  sourcePage: 8,
  description: fasDescription,
  requirements: [creditRequirement, residencyRequirement],
};

export default fasRequirements;
