import { useState, useEffect } from 'react';
import Layout from '../components/Layout/Layout';
import PlanningSection from '../components/YearSchedule/PlanningSection';
import RequirementsSection from '../components/YearSchedule/RequirementsSection';
import { Season } from '../shared/firestoreTypes';
import { getUniqueSemesters, getSchedulesBySemester } from '../shared/util';
import useClassCache from '../src/context/classCache';
import useUserData from '../src/context/userData';
import validateSchedules, { RequirementsMet, getReqs } from '../src/requirements';
import basicRequirements from '../src/requirements/cs/basic';
import { Requirement, RequirementGroup } from '../src/requirements/util';

const PlanPage = function () {
  const { data } = useUserData();
  // scheduleIds maps year + season to scheduleId
  const [scheduleIds, setSelectedSchedules] = useState<Record<string, string>>({});
  const [validationResults, setValidationResults] = useState<RequirementsMet>({});
  const [selectedRequirements, setSelectedRequirements] = useState<RequirementGroup>(basicRequirements);
  const [highlightedRequirement, setHighlightedRequirement] = useState<Requirement>();
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
          getSchedulesBySemester(data, year, season)[0]?.id,
        );
      }
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  useEffect(() => {
    const schedules = Object.values(scheduleIds).map((id) => data.schedules[id]);
    if (schedules.some((val) => !val)) return;
    const results = validateSchedules(
      schedules,
      getReqs(selectedRequirements),
      data,
      getClass,
    );
    setValidationResults(results);
  }, [scheduleIds, selectedRequirements, data, getClass]);

  return (
    <Layout size="w-full md:p-8" title="Plan">
      <div className="grid md:grid-rows-1 min-h-screen md:grid-cols-[auto_1fr] items-stretch gap-4">
        <RequirementsSection
          {...{
            selectedRequirements,
            setSelectedRequirements,
            highlightRequirement: setHighlightedRequirement,
            highlightedRequirement,
            notification,
            setNotification,
            validationResults,
          }}
        />

        <PlanningSection
          {...{
            scheduleIds,
            highlightedRequirement,
            selectSchedule,
          }}
        />
      </div>
    </Layout>
  );
};

export default PlanPage;
