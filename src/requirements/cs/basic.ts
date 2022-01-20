/**

REQUIREMENTS

The requirements detailed below apply to students declaring a concentration in Computer
Science beginning in academic year 2021-22. Students declaring the concentration prior to
2021-22 should consult the relevant archived version of the student handbook and contact the
department for further information.

*/

import { Requirement, RequirementGroup } from '../util';
import {
  countTag,
  descriptionOnly,
  otherInformation,
  requirements,
} from './util';

// eslint-disable-next-line import/prefer-default-export
export const mathematicalPreparation: RequirementGroup = {
  groupId: 'Mathematical preparation',
  subheading:
    '2–5 courses, see Note on Mathematical preparation in item c. below',
  sourcePage: 56,
  requirements: [
    {
      id: 'Pre-calculus and single-variable calculus',
      description:
        'Either MATH MA, MB, and 1B, or MATH 1A and 1B. Students may place out of some or all of this requirement depending on their starting Mathematics course.',
      sourcePage: 56,
      reducer: (prev, cls) => {
        if (
          ['MATH MA', 'MATH MB', 'MATH 1A', 'MATH 1B'].includes(
            cls.SUBJECT + cls.CATALOG_NBR,
          )
        ) {
          return prev + 1;
        }
        return null;
      },
      validate: () => true, // assume not required
    },
    {
      id: 'Linear algebra',
      description:
        'One course in linear algebra. Satisfied by APMTH 22A, MATH 21B, MATH 22A, MATH 23A, MATH 25A, MATH 55A, or a more advanced course.',
      sourcePage: 57,
      ...countTag('linearalgebra'),
    },
    {
      id: 'Probability',
      description:
        'One course in probability. Satisfied by STAT 110, ENG-SCI 150, MATH 154, or a more advanced course.',
      sourcePage: 57,
      ...countTag('probability'),
    },
  ],
};

const formalReasoning: RequirementGroup = {
  groupId: 'Formal Reasoning tag',
  subheading: '3 courses in the Computer Science core',
  description:
    'Three courses on formal reasoning about computer science, including at least:',
  sourcePage: 57,
  requirements: [
    requirements.discreteMath,
    requirements.computationalLimitations,
    {
      id: 'Algorithms tag (1 course in the Computer Science core)',
      description: 'One course covering topics in algorithms',
      sourcePage: 57,
      ...countTag('algorithms'),
    },
  ],
};

export const csCore: RequirementGroup = {
  groupId: 'Computer Science core',
  subheading: '9 courses',
  description:
    "Nine courses from an approved list on the concentration's website. This list contains Computer Science courses and some courses in related fields. These courses must, taken together, satisfy the following “tag” requirements. The concentration website has a list of tags and the corresponding courses. (For convenience, a table of tags and courses as of 2021 is included below.) A tag requirement is satisfied or partially satisfied by a Plan of Study containing a corresponding course. Each course on a Plan of Study may satisfy zero, one, two, or more tag requirements. Example Plans of Study satisfying these requirements can be found on the concentration website. While some courses can satisfy multiple tags, students still need to take nine Computer Science core courses.",
  sourcePage: 57,
  requirements: [
    requirements.programmingOneAndTwo as Requirement<any>,
    formalReasoning,
    requirements.systems,
    requirements.computationAndTheWorld,
    {
      id: 'Advanced Computer Science tag (4 courses in the Computer Science core)',
      description:
        'Four sufficiently advanced Computer Science courses, roughly corresponding to all CS courses numbered 100 and above. (See the concentration website for the full list.)',
      sourcePage: 57,
      ...countTag('advancedcs', 4),
    },
  ],
};

const requiredCourses: RequirementGroup = {
  groupId: 'Required courses',
  subheading: '11–14 courses',
  description:
    'A student’s Plan of Study must satisfy each of the requirements below.',
  sourcePage: 56,
  requirements: [
    mathematicalPreparation,
    csCore,
    {
      id: 'Note on Mathematical preparation',
      description: `The total number of required courses for the concentration depends on the starting Mathematics course (see Requirements above).
i. Students starting in MATH MA: 14 courses (five courses to complete the mathematics requirements).
ii. Students starting in MATH 1A: 13 courses (four courses to complete the mathematics requirements).
iii. Students starting in MATH 1B: 12 courses (three courses to complete the mathematics requirements).
iv. Students starting in MATH 21B or similar: 11 courses (two courses to complete the mathematics requirements).`,
      sourcePage: 57,
      ...descriptionOnly(),
    },
  ],
};

const basicRequirements: RequirementGroup = {
  groupId: 'CS - Basic Requirements',
  subheading: '11–14 courses (44–56 credits)',
  sourcePage: 56,
  requirements: [
    requiredCourses,
    requirements.tutorial,
    {
      id: 'Thesis',
      description: 'None.',
      sourcePage: 58,
      ...descriptionOnly(),
    },
    requirements.generalExamination,
    otherInformation,
  ],
};

export default basicRequirements;
