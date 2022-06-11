import { ExtendedClass } from '../../shared/apiTypes';
import {
  ClassId, Schedule, UserProfile,
} from '../../shared/firestoreTypes';
import { allTruthy, getClassId } from '../../shared/util';
import type { ClassCache } from '../features/classCache';
import collegeRequirements from './college';
import basicRequirements from './cs/basic';
import honorsRequirements from './cs/honors';
import fasRequirements from './degree';
import {
  ChildResults,
  GroupResult,
  ReqResult,
  Requirement,
  RequirementGroup,
} from './util';

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

export const allRequirements = [
  fasRequirements,
  collegeRequirements,
  basicRequirements,
  honorsRequirements,
];

function validateSchedule<Accumulator>(
  initialValue: Accumulator,
  req: Requirement<Accumulator>,
  schedule: Schedule,
  userData: UserProfile,
  classCache: Readonly<ClassCache>,
) {
  const allClasses: ExtendedClass[] = allTruthy(
    schedule.classes.map(({ classId }) => classCache[classId]),
  );
  const usedClasses: ClassId[] = [];
  const validationResult = allClasses.reduce((acc, cls) => {
    const result = req.reducer(acc, cls, schedule, userData);
    if (result === null) return acc;
    usedClasses.push(getClassId(cls));
    return result;
  }, initialValue);
  return [validationResult, usedClasses] as const;
}

function validateReq(
  req: Requirement,
  schedules: Schedule[],
  userData: UserProfile,
  classCache: Readonly<ClassCache>,
): ReqResult {
  if (typeof req.validate === 'undefined') {
    throw new Error('requirement with no validator');
  }
  const classes: ClassId[] = [];
  const reducerResults = schedules.reduce((acc, schedule) => {
    const [value, usedClasses] = validateSchedule(
      acc,
      req,
      schedule,
      userData,
      classCache,
    );
    classes.push(...usedClasses);
    return value;
  }, req.initialValue || 0);
  return {
    type: 'req',
    satisfied: req.validate(reducerResults),
    classes,
  };
}

/**
 * Validate a list of schedules based on a {@link RequirementGroup}.
 * @param group the requirement group to validate based on
 * @param schedules the list of schedules to check
 * @returns a {@link GroupResult}
 */
function validateSchedules(
  group: RequirementGroup,
  schedules: Schedule[],
  userData: UserProfile,
  classCache: Readonly<ClassCache>,
): GroupResult {
  const childResults: ChildResults = {};

  group.requirements.forEach((reqOrGroup) => {
    if ('groupId' in reqOrGroup) {
      childResults[reqOrGroup.groupId] = validateSchedules(
        reqOrGroup,
        schedules,
        userData,
        classCache,
      );
    } else if (typeof reqOrGroup.validate !== 'undefined') {
      childResults[reqOrGroup.id] = validateReq(
        reqOrGroup,
        schedules,
        userData,
        classCache,
      );
    }
  });

  return {
    type: 'group',
    satisfied:
      typeof group.validate !== 'undefined'
        ? group.validate(childResults)
        : Object.values(childResults).every((val) => val.satisfied),
    childResults,
  };
}

export default validateSchedules;
