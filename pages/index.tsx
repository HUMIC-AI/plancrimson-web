import { where } from 'firebase/firestore';
import { useState, useEffect, useMemo } from 'react';
import Layout from '../components/Layout/Layout';
import PlanningSection from '../components/YearSchedule/PlanningSection';
import RequirementsSection from '../components/YearSchedule/RequirementsSection';
import { allTruthy, classNames } from '../shared/util';
import { useAppSelector } from '../src/app/hooks';
import { selectClassCache } from '../src/features/classCache';
import { selectSchedules, useSchedules } from '../src/features/schedules';
import { selectSampleSchedule, selectSemesterFormat, selectShowReqs } from '../src/features/semesterFormat';
import { selectUserUid, selectUserDocument } from '../src/features/userData';
import validateSchedules from '../src/requirements';
import collegeRequirements from '../src/requirements/college';
import {
  GroupResult,
  Requirement,
  RequirementGroup,
} from '../src/requirements/util';

export default function PlanPageComponent() {
  const userUid = useAppSelector(selectUserUid);
  const userDocument = useAppSelector(selectUserDocument);
  const semesterFormat = useAppSelector(selectSemesterFormat);
  const sampleSchedule = useAppSelector(selectSampleSchedule);
  const classCache = useAppSelector(selectClassCache);
  const showReqs = useAppSelector(selectShowReqs);

  // we load all user schedules
  const q = useMemo(() => where('ownerUid', '==', userUid), [userUid]);
  useSchedules(q);
  const schedules = useAppSelector(selectSchedules);

  const [validationResults, setValidationResults] = useState<GroupResult | null>(null);
  const [selectedRequirements, setSelectedRequirements] = useState<RequirementGroup>(collegeRequirements);
  const [highlightedRequirement, setHighlightedRequirement] = useState<Requirement>();
  const [notification, setNotification] = useState(true);

  useEffect(() => {
    const showSchedules = semesterFormat === 'sample'
      ? sampleSchedule!.schedules
      : allTruthy(
        Object.values(userDocument.selectedSchedules).map((id) => (id ? schedules[id] : null)),
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
    <Layout size="w-full md:px-8" title="Plan">
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
