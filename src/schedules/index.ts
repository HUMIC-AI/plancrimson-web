import { Schedule, UserData } from '../firestoreTypes';
import { ClassCache } from '../hooks';
import { Requirement } from './util';

// want to query for all people planning to take this class at a certain time

const validateSchedule = (schedule: Schedule, requirements: Requirement[], userData: UserData, classCache: ClassCache) => {
  const requirementsMet = {} as Record<string, any>;
  const classesUsed = {} as Record<string, string[]>;

  requirements.forEach((req) => {
    requirementsMet[req.id] = req.initialValue;
    classesUsed[req.id] = [];
  });

  schedule.classes.reduce((acc, cls) => {
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
  }, requirementsMet);

  return [requirementsMet, classesUsed];
};

export default validateSchedule;
