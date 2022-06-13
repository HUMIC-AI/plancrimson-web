import { where } from 'firebase/firestore';
import { useState, useEffect, useMemo } from 'react';
import Layout from '../components/Layout/Layout';
import PlanningSection from '../components/YearSchedule/PlanningSection';
import RequirementsSection from '../components/YearSchedule/RequirementsSection';
import { allTruthy, classNames } from '../shared/util';
import {
  Auth, ClassCache, Planner, Profile, Schedules, Settings,
} from '../src/features';
import { useAppSelector } from '../src/hooks';
import validateSchedules from '../src/requirements';
import collegeRequirements from '../src/requirements/college';
import {
  GroupResult,
  Requirement,
  RequirementGroup,
} from '../src/requirements/util';

export default function PlanPage() {
  const userId = Auth.useAuthProperty('uid');
  const profile = useAppSelector(Profile.selectUserProfile);
  const semesterFormat = useAppSelector(Planner.selectSemesterFormat);
  const sampleSchedule = useAppSelector(Planner.selectSampleSchedule);
  const showReqs = useAppSelector(Planner.selectShowReqs);
  const chosenSchedules = useAppSelector(Settings.selectChosenSchedules);
  const schedules = useAppSelector(Schedules.selectSchedules);
  const classCache = useAppSelector(ClassCache.selectClassCache);

  const [validationResults, setValidationResults] = useState<GroupResult | null>(null);
  const [selectedRequirements, setSelectedRequirements] = useState<RequirementGroup>(collegeRequirements);
  const [highlightedRequirement, setHighlightedRequirement] = useState<Requirement>();
  const [notification, setNotification] = useState(true);

  // check if the user has no schedules
  // if so, create them
  const q = useMemo(() => (userId ? [where('ownerUid', '==', userId)] : []), [userId]);

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
  }, [selectedRequirements, classCache, sampleSchedule, semesterFormat, profile]);

  return (
    <Layout
      className={classNames(
        showReqs && 'md:p-8 md:grid-rows-1 md:grid-cols-[auto_1fr] items-stretch gap-4',
        userId ? 'min-h-screen' : 'flex-1',
        'w-full grid',
      )}
      title="Plan"
      scheduleQueryConstraints={q}
    >
      {showReqs && userId && (
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
    </Layout>
  );
}
