import { Requirement, RequirementGroup } from '../util';
import { mathematicalPreparation } from './basic';
import {
  countTag, descriptionOnly, otherInformation, requirements,
} from './util';

const formalReasoning: RequirementGroup = {
  groupId: 'Formal Reasoning tag',
  subheading: '3 courses in the Computer Science core',
  description: 'Same as Basic Requirements, but requiring Intermediate Algorithms rather than Algorithms, as follows',
  sourcePage: 58,
  requirements: [
    requirements.discreteMath,
    requirements.computationalLimitations,
    {
      id: 'Intermediate Algorithms tag (1 course in the Computer Science core)',
      description: 'One course covering basic and intermediate topics in algorithms. Replaces the Algorithms tag from the Basic Requirements.',
      sourcePage: 59,
      ...countTag('intermediatealgorithms'),
    },
  ],
};

const csCore: RequirementGroup = {
  groupId: 'Computer Science core',
  subheading: '11 courses',
  description: 'Eleven courses from an approved list on the concentration’s website. This is the same list as for the basic requirements, but two more courses are required. These courses, taken together, must satisfy the following tag requirements.',
  sourcePage: 58,
  requirements: [
    requirements.programmingOneAndTwo as Requirement<any>,
    formalReasoning,
    requirements.systems,
    requirements.computationAndTheWorld,
    {
      id: 'Artificial Intelligence tag',
      subheading: '1 course in the Computer Science core',
      description: 'One course covering topics in artificial intelligence. (Most such courses will simultaneously satisfy the Computation and the World tag.)',
      sourcePage: 59,
      ...countTag('ai'),
    },
    {
      id: 'Advanced Computer Science tag',
      subheading: '5 courses in the Computer Science core',
      description: 'Five sufficiently advanced Computer Science courses (one more than in the Basic Requirements).',
      sourcePage: 59,
      ...countTag('advancedcs', 4),
    },
  ],
};

const requiredCourses: RequirementGroup = {
  groupId: 'Required Courses',
  subheading: '13–16 courses',
  description: 'A student’s Plan of Study must satisfy each of the requirements below. Courses are allowed to satisfy multiple requirements, but a student’s Plan of Study must still comprise thirteen to sixteen courses in total.',
  sourcePage: 58,
  requirements: [
    mathematicalPreparation,
    csCore,
  ],
};

const honorsRequirements: RequirementGroup = {
  groupId: 'CS - Honors Requirements',
  subheading: '13–16 courses (52–64 credits)',
  sourcePage: 58,
  requirements: [
    requiredCourses,
    requirements.tutorial,
    {
      id: 'Thesis',
      description: 'Optional but encouraged. See honors requirements on the Computer Science website at https://csadvising.seas.harvard.edu/concentration/degrees/. Students writing theses are often enrolled in COMPSCI 91R. This course is repeatable, but may be taken at most twice for academic credit, and only one semester of COMPSCI 91R may be counted toward concentration requirements as a Computer Science core course. Students wishing to enroll in COMPSCI 91R must file a project proposal to be signed by the student and the faculty supervisor and approved by the Directors of Undergraduate Studies. The project proposal form can be found on the Computer Science website.',
      sourcePage: 59,
      ...descriptionOnly(),
    },
    requirements.generalExamination,
    otherInformation,
  ],
};

export default honorsRequirements;
