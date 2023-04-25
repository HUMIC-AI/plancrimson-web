import { semesterToTerm } from '@/src/lib';
import { isScheduleId } from '@/src/utils/schedules';
import { useAppSelector } from '@/src/utils/hooks';
import { Schedules, Settings } from '@/src/features';
import type { ScheduleIdOrSemester } from '@/src/types';

/**
 * If the argument is a semester, semester will be populated and schedule will contain the chosen schedule for that semester (if it exists).
 * If the argument is an existing schedule id, semester and schedule will be populated.
 * If the argument is an invalid schedule id, both semester and schedule will be null.
 */
export function useScheduleFromScheduleIdOrSemester(s: ScheduleIdOrSemester) {
  const semesterScheduleId = useAppSelector(Settings.selectChosenScheduleId(isScheduleId(s) ? null : semesterToTerm(s)));
  const scheduleId = isScheduleId(s) ? s : semesterScheduleId;
  const schedule = useAppSelector(Schedules.selectSchedule(scheduleId));

  if (isScheduleId(s)) {
    return {
      semester: schedule && { year: schedule.year, season: schedule.season },
      schedule,
    };
  }

  return { semester: s, schedule };
}
