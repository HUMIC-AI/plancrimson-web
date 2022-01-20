import React from 'react';
import { Class } from '../../shared/apiTypes';
import { Schedule, Semester, UserData } from '../../shared/firestoreTypes';

/**
 * Only works for users on a typical four-year schedule.
 * @param schedule the schedule to see which school year it is part of
 * @param classYear the user's graduation year
 * @returns school year, e.g. 1 for freshman, ..., 4 for senior
 */
export function getSchoolYear(schedule: Semester, classYear: number) {
  let ret = schedule.year;
  if (schedule.season === 'Fall') ret += 1;
  return ret - classYear + 4;
}

/**
 * Every class that the user is taking is passed through `reducer`.
 * The final result is then given to `validate` to check if the user's classes
 * satisfy this requirement.
 */
export type Requirement<Accumulator = number> = {
  id: string;
  description?: React.ReactNode;
  sourcePage: number;
  validate?: (value: Accumulator) => boolean;
  initialValue?: Accumulator;

  // should return null to indicate no change
  reducer: (
    prev: Accumulator,
    cls: Class,
    schedule: Schedule,
    userData: UserData
  ) => Accumulator | null;
};

export type ChildResults = Record<string, GroupResult | ReqResult>;

export type RequirementGroup = {
  groupId: string;
  subheading?: string;
  description?: React.ReactNode;
  sourcePage: number;
  requirements: (Requirement | RequirementGroup)[];
  sampleSchedules?: SampleSchedule[];
  validate?: (childResults: ChildResults) => boolean;
};

export type ReqResult = {
  type: 'req';
  satisfied: boolean;
  classes?: string[];
};

export type GroupResult = {
  type: 'group';
  satisfied: boolean;
  childResults: ChildResults;
};

export type SampleSchedule = {
  id: string;
  source: string;
  name: string;
  schedules: Schedule[];
};
