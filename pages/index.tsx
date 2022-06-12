import { getDocs, query, where } from 'firebase/firestore';
import { useState, useEffect, useMemo } from 'react';
import Layout from '../components/Layout/Layout';
import PlanningSection from '../components/YearSchedule/PlanningSection';
import RequirementsSection from '../components/YearSchedule/RequirementsSection';
import { Schema, Schedule } from '../shared/firestoreTypes';
import { allTruthy, classNames, getUniqueSemesters } from '../shared/util';
import {
  Auth, ClassCache, Planner, Profile, Schedules, Settings,
} from '../src/features';
import { useAppDispatch, useAppSelector } from '../src/hooks';
import validateSchedules from '../src/requirements';
import collegeRequirements from '../src/requirements/college';
import {
  GroupResult,
  Requirement,
  RequirementGroup,
} from '../src/requirements/util';

export default function PlanPage() {
  const dispatch = useAppDispatch();
  const userId = Auth.useAuthProperty('uid');
  const classYear = useAppSelector(Profile.selectClassYear);
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
    if (q.length === 0 || !classYear) return;

    (async () => {
      const snap = await getDocs(query(Schema.Collection.schedules(), ...q)).catch((err) => console.error('error querying for user schedules', err));
      if (!snap || !snap.empty || !userId) return;
      const promises = getUniqueSemesters(classYear).map(({ year, season }) => dispatch(Schedules.createDefaultSchedule({ year, season }, userId)));
      const settled = await Promise.allSettled(promises);
      settled.forEach((result) => {
        if (result.status === 'fulfilled') {
          const schedule = result.value.payload as Schedule;
          dispatch(Settings.chooseSchedule({ term: `${schedule.year}${schedule.season}`, scheduleId: schedule.id }));
        } else {
          console.error('error creating default schedules', result.reason);
        }
      });
    })();
  }, [userId, classYear]);

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
