import { useState, useEffect, useMemo } from 'react';
import Layout from '../components/Layout/Layout';
import PlanningSection from '../components/YearSchedule/PlanningSection';
import RequirementsSection from '../components/YearSchedule/RequirementsSection';
import { allTruthy } from '../shared/util';
import { useAppSelector } from '../src/app/hooks';
import { selectClassCache } from '../src/features/classCache';
import { selectSampleSchedule, selectSemesterFormat } from '../src/features/semesterFormat';
import { selectUserDocument } from '../src/features/userData';
import validateSchedules from '../src/requirements';
import collegeRequirements from '../src/requirements/college';
import {
  GroupResult,
  Requirement,
  RequirementGroup,
} from '../src/requirements/util';

const PlanPageComponent = function () {
  const userDocument = useAppSelector(selectUserDocument);
  const semesterFormat = useAppSelector(selectSemesterFormat);
  const sampleSchedule = useAppSelector(selectSampleSchedule);
  const classCache = useAppSelector(selectClassCache);

  const [validationResults, setValidationResults] = useState<GroupResult | null>(null);
  const [selectedRequirements, setSelectedRequirements] = useState<RequirementGroup>(collegeRequirements);
  const [highlightedRequirement, setHighlightedRequirement] = useState<Requirement>();
  const [notification, setNotification] = useState(true);

  useEffect(() => {
    const showSchedules = semesterFormat === 'sample'
      ? sampleSchedule!.schedules
      : allTruthy(
        Object.values(userDocument.selectedSchedules).map((id) => (id ? userDocument.schedules[id] : null)),
      );
    const results = validateSchedules(
      selectedRequirements,
      showSchedules,
      userDocument,
      classCache,
    );
    setValidationResults(results);
  }, [selectedRequirements, classCache, sampleSchedule, semesterFormat, userDocument]);

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

      <PlanningSection highlightedRequirement={highlightedRequirement} />
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
