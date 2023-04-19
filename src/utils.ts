import { compareSemesters, Semester } from 'plancrimson-utils';
import { Schedule, ScheduleMap, UserSettings } from './types';

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
