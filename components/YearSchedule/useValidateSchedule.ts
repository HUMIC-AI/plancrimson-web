import { useState, useEffect } from 'react';
import { allTruthy } from '@/src/lib';
import {
  ClassCache, Planner, Profile, Schedules, Settings,
} from '@/src/features';
import { useAppSelector } from '@/src/utils/hooks';
import validateSchedules from '@/src/requirements';
import { GroupResult, RequirementGroup } from '@/src/requirements/util';

export function useValidateSchedule(selectedRequirements: RequirementGroup) {
  const profile = useAppSelector(Profile.selectUserProfile);
  const semesterFormat = useAppSelector(Planner.selectSemesterFormat);
  const sampleSchedule = useAppSelector(Planner.selectSampleSchedule);
  const chosenSchedules = useAppSelector(Settings.selectChosenSchedules);
  const schedules = useAppSelector(Schedules.selectSchedules);
  const classCache = useAppSelector(ClassCache.selectClassCache);

  const [validationResults, setValidationResults] = useState<GroupResult | null>(null);

  useEffect(() => {
    const showSchedules = semesterFormat === 'sample'
      ? sampleSchedule!.schedules
      : allTruthy(
        Object.values(chosenSchedules).map((id) => (id ? schedules[id] : null)),
      );
    const results = validateSchedules(
      selectedRequirements,
      showSchedules,
      profile,
      classCache,
    );
    setValidationResults(results);
  }, [selectedRequirements, classCache, sampleSchedule, semesterFormat, profile, chosenSchedules, schedules]);

  return validationResults;
}
