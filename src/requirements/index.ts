import { Schedule, UserData } from '../../shared/firestoreTypes';
import { Requirement, RequirementGroup } from './util';
import fasRequirements from './degree';
import basicRequirements from './cs/basic';
import honorsRequirements from './cs/honors';
import { ClassCacheContextType } from '../context/classCache';
import collegeRequirements from './college';

// want to query for all people planning to take this class at a certain time

export const getReqs = (reqs: Requirement[] | RequirementGroup) => {
  if (!('groupId' in reqs)) return reqs;
  const ret: Requirement[] = [];
  reqs.requirements.forEach((req) => {
    if ('groupId' in req) ret.push(...getReqs(req));
    else ret.push(req);
  });
  return ret;
};

export type RequirementsMet = {
  [requirementId: string]: {
    satisfied: boolean;
    classes?: string[];
  };
};

export const allRequirements = [
  fasRequirements,
  collegeRequirements,
  basicRequirements,
  honorsRequirements,
];

const validateSchedules = (
  schedules: Schedule[],
  allReqs: Requirement[],
  userData: UserData,
  getClass: ClassCacheContextType['getClass'],
): RequirementsMet => {
  const requirementsMet = {} as Record<string, any>;
  const classesUsed = {} as Record<string, string[]>;

  const requirements = allReqs.filter((req) => typeof req.validate !== 'undefined');

  requirements.forEach((req) => {
    requirementsMet[req.id] = req.initialValue || 0;
    classesUsed[req.id] = [];
  });

  const reducerResults = schedules.reduce(
    (prev, schedule) => schedule.classes.reduce(
      (acc, cls) => {
        if (!getClass(cls.classId)) return acc;
        const next = {} as Record<string, any>;
        requirements.forEach((req) => {
          const newValue = req.reducer(
            acc[req.id],
            getClass(cls.classId)!,
            schedule,
            userData,
          );
          if (newValue !== null) {
            next[req.id] = newValue;
            classesUsed[req.id].push(cls.classId);
          } else {
            next[req.id] = acc[req.id];
          }
        });
        return next;
      },
      prev,
    ),
    requirementsMet,
  );

  const results: RequirementsMet = {};
  requirements.forEach((req) => {
    results[req.id] = {
      satisfied: req.validate!(reducerResults[req.id]),
      classes: classesUsed[req.id],
    };
  });

  return results;
};

export default validateSchedules;
