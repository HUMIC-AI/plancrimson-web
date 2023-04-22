import { compareSemesters, Semester } from 'plancrimson-utils';
import { Schedule, ScheduleMap, UserSettings } from './types';

// See the defaults from https://tailwindcss.com/docs/screens
export const breakpoints = {
  sm: 640,
  md: 768,
  lg: 1024,
};

export function getInitialSettings(): UserSettings {
  return {
    chosenSchedules: {},
    customTimes: {},
    waivedRequirements: {},
  };
}

export function getSchedulesBySemester(
  schedules: ScheduleMap,
  semester: Semester,
) {
  return sortSchedules(schedules).filter(
    ({ year, season }) => year === semester.year && season === semester.season,
  );
}

export function sortSchedules(schedules: ScheduleMap) {
  return Object.values(schedules).sort(compareSemesters);
}

export function getAllClassIds(schedules: Schedule[]): string[] {
  return schedules.flatMap((schedule) => schedule.classes.map((cls) => cls.classId));
}

export function classNames(...classes: (string | boolean)[]) {
  return classes
    .filter(Boolean)
    .join(' ')
    .replace(
      'hover-blue',
      'shadow rounded bg-black hover:bg-opacity-50 text-white transition-colors',
    );
}


export function throwMissingContext<T>(): T {
  throw new Error('must provide context element');
}
