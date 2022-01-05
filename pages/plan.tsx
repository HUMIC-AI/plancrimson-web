import {
  useState, useEffect, useCallback, useMemo,
} from 'react';
import Layout from '../components/Layout/Layout';
import PlanningSection from '../components/YearSchedule/PlanningSection';
import RequirementsSection from '../components/YearSchedule/RequirementsSection';
import { Season } from '../shared/firestoreTypes';
import { getUniqueSemesters, getSchedulesBySemester, allTruthy } from '../shared/util';
import useClassCache from '../src/context/classCache';
import { ShowAllSchedulesContext } from '../src/context/showAllSchedules';
import useUserData from '../src/context/userData';
import validateSchedules, { RequirementsMet, getReqs } from '../src/requirements';
import collegeRequirements from '../src/requirements/college';
import { Requirement, RequirementGroup } from '../src/requirements/util';

const PlanPage = function () {
  const { data } = useUserData();
  // scheduleIds maps year + season to scheduleId
  const [scheduleIds, setSelectedSchedules] = useState<Record<string, string | null>>({});
  const [validationResults, setValidationResults] = useState<RequirementsMet>({});
  const [selectedRequirements, setSelectedRequirements] = useState<RequirementGroup>(collegeRequirements);
  const [highlightedRequirement, setHighlightedRequirement] = useState<Requirement>();
  const [notification, setNotification] = useState(true);
  const [showAllSchedules, setShowAllSchedules] = useState(false);
  const getClass = useClassCache(data);

  const selectSchedule = useCallback((year: number, season: Season, schedule: string | null) => {
    setSelectedSchedules((prev) => ({
      ...prev,
      [year + season]: schedule,
    }));
  }, []);

  useEffect(() => {
    getUniqueSemesters(data).forEach(({ year, season }) => {
      if (!scheduleIds[year + season]) {
        selectSchedule(
          year,
          season,
          getSchedulesBySemester(data, year, season)[0]?.id || null,
        );
      }
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  useEffect(() => {
    const schedules = allTruthy(Object.values(scheduleIds).map((id) => (id ? data.schedules[id] : null)));
    const results = validateSchedules(
      schedules,
      getReqs(selectedRequirements),
      data,
      getClass,
    );
    setValidationResults(results);
  }, [scheduleIds, selectedRequirements, data, getClass]);

  const context = useMemo(() => ({
    showAllSchedules,
    setShowAllSchedules,
  }), [showAllSchedules, setShowAllSchedules]);

  return (
    <Layout size="w-full md:p-8" title="Plan">
      <ShowAllSchedulesContext.Provider value={context}>
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
      </ShowAllSchedulesContext.Provider>
    </Layout>
  );
};

export default PlanPage;
