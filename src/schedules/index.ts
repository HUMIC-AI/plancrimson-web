import { Schedule, UserData } from '../firestoreTypes';
import { ClassCache } from '../hooks';
import { Requirement, RequirementGroup } from './util';

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

const validateSchedules = (schedules: Schedule[], requirements: Requirement[], userData: UserData, classCache: ClassCache) => {
  const requirementsMet = {} as Record<string, any>;
  const classesUsed = {} as Record<string, string[]>;

  requirements.forEach((req) => {
    requirementsMet[req.id] = req.initialValue || 0;
    classesUsed[req.id] = [];
  });

  const finalRequirements = schedules.reduce(
    (prev, schedule) => schedule.classes.reduce(
      (acc, cls) => {
        const next = {} as Record<string, any>;
        requirements.forEach((req) => {
          const newValue = req.reducer(Object.freeze(acc[req.id]), classCache[cls.classId], schedule, userData);
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

  return [finalRequirements, classesUsed];
};

export default validateSchedules;
