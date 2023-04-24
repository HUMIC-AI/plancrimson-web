import { useMemo } from 'react';
import { getUniqueSemesters, compareSemesters } from 'plancrimson-utils';
import {
  Planner, Profile, Schedules, Settings,
} from '@/src/features';
import { useAppSelector } from '@/src/utils/hooks';
import { SemesterDisplayProps } from '@/components/YearSchedule/SemesterColumn/SemesterColumn';

/**
 * Gets the list of semesters to display in the planner
 */
export function useColumns() {
  const semesterFormat = useAppSelector(Planner.selectSemesterFormat);
  const userSchedules = useAppSelector(Schedules.selectSchedules);
  const classYear = useAppSelector(Profile.selectClassYear);
  const sampleSchedule = useAppSelector(Planner.selectSampleSchedule);
  const chosenSchedules = useAppSelector(Settings.selectChosenSchedules);

  const columns: SemesterDisplayProps[] = useMemo(() => {
    switch (semesterFormat) {
      case 'sample':
        if (!sampleSchedule) return [];
        return sampleSchedule.schedules.map(({ year, season, id }) => ({
          semester: { year, season },
          chosenScheduleId: id,
          key: id,
        }));

      case 'selected':
        if (!classYear) return [];
        return getUniqueSemesters(
          classYear,
          ...Object.values(userSchedules),
        ).map(({ year, season }) => ({
          key: `${year}${season}`,
          semester: { year, season },
          chosenScheduleId: chosenSchedules[`${year}${season}`] || null,
        }));

      case 'all':
        return Object.values(userSchedules)
          .sort(compareSemesters)
          .map(({ year, season, id }) => ({
            key: id,
            semester: { year, season },
            chosenScheduleId: id,
            highlight: chosenSchedules[`${year}${season}`] || undefined,
          }));

      default:
        return [];
    }
  }, [semesterFormat, sampleSchedule, classYear, userSchedules, chosenSchedules]);

  return columns;
}
