import { useState, useEffect } from 'react';
import Layout from '../components/Layout/Layout';
import PlanningSection from '../components/YearSchedule/PlanningSection';
import RequirementsSection from '../components/YearSchedule/RequirementsSection';
import { getUniqueSemesters, allTruthy } from '../shared/util';
import useClassCache from '../src/context/classCache';
import useShowAllSchedules from '../src/context/showAllSchedules';
import useUserData from '../src/context/userData';
import validateSchedules from '../src/requirements';
import collegeRequirements from '../src/requirements/college';
import {
  GroupResult,
  Requirement,
  RequirementGroup,
} from '../src/requirements/util';

const PlanPageComponent = function () {
  const { data, selectSchedule } = useUserData();
  // scheduleIds maps year + season to scheduleId
  const { showAllSchedules, sampleSchedule } = useShowAllSchedules();
  const [validationResults, setValidationResults] = useState<GroupResult | null>(null);
  const [selectedRequirements, setSelectedRequirements] = useState<RequirementGroup>(collegeRequirements);
  const [highlightedRequirement, setHighlightedRequirement] = useState<Requirement>();
  const [notification, setNotification] = useState(true);
  const classCache = useClassCache(
    Object.values(data.schedules).concat(
      sampleSchedule ? sampleSchedule.schedules : [],
    ),
  );

  useEffect(() => {
    getUniqueSemesters(data.classYear, Object.values(data.schedules)).forEach(
      ({ year, season }) => {
        if (!data.selectedSchedules[`${year}${season}`]) {
          // selectSchedule(
          //   year,
          //   season,
          //   getSchedulesBySemester(data, year, season)[0]?.id || null,
          // );
        }
      },
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  useEffect(() => {
    const schedules = showAllSchedules === 'sample'
      ? sampleSchedule!.schedules
      : allTruthy(
        Object.values(data.selectedSchedules).map((id) => (id ? data.schedules[id] : null)),
      );
    const results = validateSchedules(
      selectedRequirements,
      schedules,
      data,
      classCache,
    );
    setValidationResults(results);
  }, [
    selectedRequirements,
    data,
    classCache,
    showAllSchedules,
    sampleSchedule,
  ]);

  return (
    <div className="grid md:grid-rows-1 min-h-screen py-8 md:grid-cols-[auto_1fr] items-stretch gap-4">
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
          highlightedRequirement,
          selectSchedule,
        }}
      />
    </div>
  );
};

export default function PlanPage() {
  return (
    <Layout size="w-full md:px-8" title="Plan">
      <PlanPageComponent />
    </Layout>
  );
}
