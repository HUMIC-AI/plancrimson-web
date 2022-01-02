/* eslint-disable no-param-reassign */
import React, { useEffect, useState } from 'react';
import { getUniqueSemesters, getSchedulesBySemester } from '../../shared/util';
import useUserData from '../../src/context/userData';
import { Season } from '../../shared/firestoreTypes';
import validateSchedules, { getReqs, RequirementsMet } from '../../src/requirements';
import basicRequirements from '../../src/requirements/cs/basic';
import { RequirementGroup } from '../../src/requirements/util';
import useClassCache from '../../src/context/classCache';
import RequirementsSection from './RequirementsSection';
import PlanningSection from './PlanningSection';

const YearSchedule: React.FC = function () {
  const { data } = useUserData();
  // scheduleIds maps year + season to scheduleId
  const [scheduleIds, setSelectedSchedules] = useState<Record<string, string>>({});
  const [validationResults, setValidationResults] = useState<RequirementsMet>({});
  const [selectedRequirements, setSelectedRequirements] = useState<RequirementGroup>(basicRequirements);
  const [highlightedClasses, setHighlightedClasses] = useState<string[]>([]);
  const [notification, setNotification] = useState(true);
  const getClass = useClassCache(data);

  const selectSchedule = (year: number, season: Season, schedule: string) => {
    setSelectedSchedules((prev) => ({
      ...prev,
      [year + season]: schedule,
    }));
  };

  useEffect(() => {
    getUniqueSemesters(data).forEach(({ year, season }) => {
      if (!scheduleIds[year + season]) {
        selectSchedule(
          year,
          season,
          getSchedulesBySemester(data, year, season)[0].id,
        );
      }
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  useEffect(() => {
    const results = validateSchedules(
      Object.values(scheduleIds).map((id) => data.schedules[id]),
      getReqs(selectedRequirements),
      data,
      getClass,
    );
    setValidationResults(results);
  }, [scheduleIds, selectedRequirements, data, getClass]);

  return (
    <div className="grid md:grid-rows-1 min-h-screen md:grid-cols-[auto_1fr] items-stretch gap-4">
      <RequirementsSection
        {...{
          selectedRequirements,
          setSelectedRequirements,
          setHighlightedClasses,
          notification,
          setNotification,
          validationResults,
        }}
      />

      <PlanningSection
        {...{
          scheduleIds,
          highlightedClasses,
          selectSchedule,
        }}
      />
    </div>
  );
};

export default YearSchedule;
