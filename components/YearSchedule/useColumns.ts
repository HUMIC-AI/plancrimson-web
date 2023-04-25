import { useMemo } from 'react';
import { getUniqueSemesters, compareSemesters } from '@/src/lib';
import {
  Planner, Profile, Schedules,
} from '@/src/features';
import { useAppSelector } from '@/src/utils/hooks';
import { ListOfScheduleIdOrSemester } from '@/src/types';

/**
 * Gets the list of semesters to display in the planner
 */
export function useColumns() {
  const semesterFormat = useAppSelector(Planner.selectSemesterFormat);
  const userSchedules = useAppSelector(Schedules.selectSchedules);
  const classYear = useAppSelector(Profile.selectClassYear);
  const sampleSchedule = useAppSelector(Planner.selectSampleSchedule);

  const columns: ListOfScheduleIdOrSemester = useMemo(() => {
    switch (semesterFormat) {
      case 'sample':
        if (!sampleSchedule) return [];
        return sampleSchedule.schedules.map(({ id }) => id);

      case 'selected':
        // TODO get semesters from class year and handle gappers
        if (!classYear) return [];
        return getUniqueSemesters(
          classYear,
          ...Object.values(userSchedules),
        ).map(({ year, season }) => ({ year, season }));

      case 'all':
        return Object.values(userSchedules)
          .sort(compareSemesters)
          .map(({ id }) => id);

      default:
        return [];
    }
  }, [semesterFormat, sampleSchedule, classYear, userSchedules]);

  return columns;
}
