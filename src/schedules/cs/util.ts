import { Class } from '../../../shared/apiTypes';
import { Requirement } from '../util';
import TAGS from './tags.json';

export function hasTag(cls: Class, tag: CSCourseTag) {
  const courseData = TAGS.find(({ courseNumber }) => new RegExp(cls.HU_ALIAS_CATNBR_NS, 'i').test(courseNumber));
  if (!courseData) return false;
  return courseData.tags.includes(tag);
}

export function countTag(tag: CSCourseTag, required = 1): Pick<Requirement, 'reducer' | 'validate'> {
  return {
    reducer: (prev: number, cls: Class) => {
      if (hasTag(cls, tag)) {
        return prev + 1;
      }
      return null;
    },
    validate: (total) => total >= required,
  };
}

export const descriptionOnly = () => ({
  reducer: () => null,
  validate: () => true,
});

type ProgrammingOneAndTwoAccumulator = {
  programming1: number;
  programming2: number;
};

const programmingOneAndTwo: Requirement<ProgrammingOneAndTwoAccumulator> = {
  id: 'Programming 1 and Programming 2 tags (2 courses in the Computer Science core)',
  description: 'Two courses on software construction and good software engineering practices. The requirement is satisfied by either one course tagged Programming 1 and one tagged Programming 2, or by two courses tagged Programming 2. Note that some Programming 1 courses, such as COMPSCI 32 and COMPSCI 50, cannot be taken for concentration credit after more advanced programming courses.',
  sourcePage: 57,
  initialValue: {
    programming1: 0,
    programming2: 0,
  },
  reducer: (prev, cls) => {
    const next = { ...prev };
    let change = false;
    if (hasTag(cls, 'programming1')) {
      next.programming1 += 1;
      change = true;
    }
    if (hasTag(cls, 'programming2')) {
      next.programming2 += 1;
      change = true;
    }
    if (change) {
      return next;
    }
    return null;
  },
  validate: ({ programming1, programming2 }) => {
    if (programming2 >= 2) return true;
    if (programming2 >= 1 && programming1 >= 1) return true;
    return false;
  },
};

export const generateAdvancedCs = (numCourses: number, numberTitle: string, sourcePage: number) => ({
  id: `Advanced Computer Science tag (${numCourses} courses in the Computer Science core)`,
  description: `${numberTitle} sufficiently advanced Computer Science courses, roughly corresponding to all CS courses numbered 100 and above. (See the concentration website for the full list.)`,
  sourcePage,
  ...countTag('advancedcs', numCourses),
});

export const requirements = {
  discreteMath: {
    id: 'Discrete Mathematics tag (0 or 1 course in the Computer Science core)',
    description: 'One course with significant discrete math content. Students may skip this requirement with approval from the Directors of Undergraduate Studies; see the Computer Science website for more information.',
    sourcePage: 57,
    ...countTag('discretemath', 0), // assume taken
  },
  computationalLimitations: {
    id: 'Computational Limitations tag (1 course in the Computer Science core)',
    description: 'One course covering topics in computability and complexity.',
    sourcePage: 57,
    ...countTag('complimitations'),
  },
  programmingOneAndTwo,
  systems: {
    id: 'Systems tag (1 course in the Computer Science core)',
    description: 'One course containing significant computer system development.',
    sourcePage: 57,
    ...countTag('systems'),
  },
  computationAndTheWorld: {
    id: 'Computation and the World tag (1 course in the Computer Science core)',
    description: 'One course on interactions between computation and the world (for example, concerning informational, natural, human, or social systems).',
    sourcePage: 57,
    ...countTag('computationandtheworld'),
  },
  tutorial: {
    id: 'Tutorial',
    description: 'Optional. Available as COMPSCI 91R. This course is repeatable, but may be taken at most twice for academic credit, and only one semester of COMPSCI 91R may be counted toward concentration requirements as a Computer Science core course. Students wishing to enroll in COMPSCI 91R must file a project proposal to be signed by the student and the faculty supervisor and approved by the Directors of Undergraduate Studies. The project proposal form can be found on the Computer Science website.',
    sourcePage: 57,
    reducer: (prev: number, cls: Class) => {
      if (cls.SUBJECT + cls.CATALOG_NBR === 'COMPSCI 91R') return prev + 1;
      return null;
    },
    validate: () => true, // optional
  },
  generalExamination: {
    id: 'General Examination',
    description: 'None.',
    sourcePage: 58,
    ...descriptionOnly(),
  },
} as const;

export const otherInformation = {
  groupId: 'Other Information',
  sourcePage: 58,
  requirements: [
    {
      id: 'Approved courses',
      description: 'With the approval of the Directors of Undergraduate Studies, other courses may be used to satisfy requirements. If a course is cross-listed with another department, it meets the same requirements for the concentration as the COMPSCI-numbered course. In general, a course may be substituted with a more advanced version on the same or similar topic. Students must secure advance approval for course substitutions by filing a Plan of Study to be approved by the Directors of Undergraduate Studies. The Plan of Study form and a description of the process to submit the form can be found on the Computer Science website',
      sourcePage: 58,
      ...descriptionOnly(),
    },
    {
      id: 'Pass/fail and SAT/UNSAT',
      description: 'No more than two of the courses used to satisfy CS Requirements may be taken pass/fail or SAT/UNSAT. Of the tag requirements, courses taken pass/fail or SAT/UNSAT can be used only for the Programming 1 and Advanced Computer Science tags. For instance, if taken pass/fail, COMPSCI 124 would not satisfy the Formal Reasoning or Algorithms tags.',
      sourcePage: 58,
      ...descriptionOnly(),
    },
    {
      id: 'Reduction of requirements for prior work',
      description: 'Except for MATH MA, MATH MB/1A, and MATH 1B, there is no reduction in concentration requirements for prior work',
      sourcePage: 58,
      ...descriptionOnly(),
    },
    {
      id: 'Plans of Study',
      description: 'Concentrators must file a Plan of Study showing how they intend to satisfy these degree requirements and keep their plan of study up to date until their program is complete. If the plan is acceptable, the student will be notified that it has been approved. To petition for an exception to any rule, the student should file a new Plan of Study and notify the Directors of Undergraduate Studies of the rationale for any exceptional conditions. Approval of a Plan of Study is the student’s guarantee that a given set of courses will satisfy degree requirements. The Plan of Study form and a description of the process to submit the form can be found on the Computer Science website',
      sourcePage: 58,
      ...descriptionOnly(),
    },
  ],
};

// jq 'map(.tags) | .[] | .[]' src/schedules/cs/tags.json | sort | uniq
const tags = [
  'advancedcs',
  'ai',
  'algorithms',
  'complimitations',
  'computationandtheworld',
  'corecs',
  'discretemath',
  'formalreasoning',
  'intermediatealgorithms',
  'linearalgebra',
  'probability',
  'programming1',
  'programming2',
  'systems',
] as const;

type CSCourseTag = typeof tags[number];
