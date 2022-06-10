import { where } from 'firebase/firestore';
import { useState, useEffect, useMemo } from 'react';
import Layout from '../components/Layout/Layout';
import PlanningSection from '../components/YearSchedule/PlanningSection';
import RequirementsSection from '../components/YearSchedule/RequirementsSection';
import { allTruthy, classNames } from '../shared/util';
import {
  Auth, ClassCache, Planner, Profile, Schedules,
} from '../src/features';
import { useAppSelector } from '../src/hooks';
import validateSchedules from '../src/requirements';
import collegeRequirements from '../src/requirements/college';
import {
  GroupResult,
  Requirement,
  RequirementGroup,
} from '../src/requirements/util';

export default function PlanPageComponent() {
  const userUid = useAppSelector(Auth.selectUserUid);
  const profile = useAppSelector(Profile.selectUserProfile);
  const semesterFormat = useAppSelector(Planner.selectSemesterFormat);
  const sampleSchedule = useAppSelector(Planner.selectSampleSchedule);
  const showReqs = useAppSelector(Planner.selectShowReqs);
  const selectedSchedules = useAppSelector(Schedules.selectSelectedSchedules);
  const schedules = useAppSelector(Schedules.selectSchedules);
  const classCache = useAppSelector(ClassCache.selectClassCache);

  // we load all user schedules
  const q = useMemo(() => [where('ownerUid', '==', userUid)], [userUid]);

  const [validationResults, setValidationResults] = useState<GroupResult | null>(null);
  const [selectedRequirements, setSelectedRequirements] = useState<RequirementGroup>(collegeRequirements);
  const [highlightedRequirement, setHighlightedRequirement] = useState<Requirement>();
  const [notification, setNotification] = useState(true);

  useEffect(() => {
    const showSchedules = semesterFormat === 'sample'
      ? sampleSchedule!.schedules
      : allTruthy(
        Object.values(selectedSchedules).map((id) => (id ? schedules[id] : null)),
      );
    const results = validateSchedules(
      selectedRequirements,
      showSchedules,
      profile,
      classCache,
    );
    setValidationResults(results);
  }, [selectedRequirements, classCache, sampleSchedule, semesterFormat, profile]);

  return (
    <Layout className="w-full md:px-8" title="Plan" scheduleQueryConstraints={q}>
      <div className={classNames(
        showReqs && 'md:grid-rows-1 md:grid-cols-[auto_1fr] items-stretch gap-4',
        'grid min-h-screen py-8',
      )}
      >
        {showReqs && (
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
        )}

        <PlanningSection highlightedRequirement={highlightedRequirement} />
      </div>
    </Layout>
  );
}
