import { getDocs, query, where } from 'firebase/firestore';
import { useState, useEffect, useMemo } from 'react';
import Layout from '../components/Layout/Layout';
import PlanningSection from '../components/YearSchedule/PlanningSection';
import RequirementsSection from '../components/YearSchedule/RequirementsSection';
import { Schema, Schedule } from '../shared/firestoreTypes';
import { allTruthy, classNames, getUniqueSemesters } from '../shared/util';
import {
  Auth, ClassCache, Planner, Profile, Schedules,
} from '../src/features';
import { useAppDispatch, useAppSelector } from '../src/hooks';
import validateSchedules from '../src/requirements';
import collegeRequirements from '../src/requirements/college';
import {
  GroupResult,
  Requirement,
  RequirementGroup,
} from '../src/requirements/util';

export default function PlanPageComponent() {
  const dispatch = useAppDispatch();
  const userId = Auth.useAuthProperty('uid');
  const classYear = useAppSelector(Profile.selectClassYear);
  const profile = useAppSelector(Profile.selectUserProfile);
  const semesterFormat = useAppSelector(Planner.selectSemesterFormat);
  const sampleSchedule = useAppSelector(Planner.selectSampleSchedule);
  const showReqs = useAppSelector(Planner.selectShowReqs);
  const selectedSchedules = useAppSelector(Schedules.selectSelectedSchedules);
  const schedules = useAppSelector(Schedules.selectSchedules);
  const classCache = useAppSelector(ClassCache.selectClassCache);

  // we load all user schedules
  const q = useMemo(() => (userId ? [where('ownerUid', '==', userId)] : []), [userId]);

  const [validationResults, setValidationResults] = useState<GroupResult | null>(null);
  const [selectedRequirements, setSelectedRequirements] = useState<RequirementGroup>(collegeRequirements);
  const [highlightedRequirement, setHighlightedRequirement] = useState<Requirement>();
  const [notification, setNotification] = useState(true);

  // check if the user has no schedules
  // if so, create them
  useEffect(() => {
    if (!userId || !classYear) return;
    getDocs(query(Schema.Collection.schedules(), ...q)).then((snap) => {
      if (snap.empty) {
        const promises = getUniqueSemesters(classYear).map(({ year, season }) => dispatch(Schedules.createDefaultSchedule({ year, season }, userId)));
        Promise.allSettled(promises).then((resolved) => {
          console.log('created default schedules', resolved);
          resolved.forEach((result) => {
            if (result.status === 'fulfilled') {
              const schedule = result.value.payload as Schedule;
              dispatch(Schedules.chooseSchedule({ term: `${schedule.year}${schedule.season}`, scheduleId: schedule.id }));
            }
          });
        });
      }
    });
  }, [userId, classYear]);

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
