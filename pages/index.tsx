import {
  useState, useEffect, useMemo, useRef,
} from 'react';
import {
  allTruthy,
} from 'plancrimson-utils';
import {
  Auth, ClassCache, Planner, Profile, Schedules, Settings,
} from '@/src/features';
import {
  alertUnexpectedError, useAppSelector,
} from '@/src/utils/hooks';
import validateSchedules from '@/src/requirements';
import collegeRequirements from '@/src/requirements/college';
import {
  GroupResult,
  Requirement,
  RequirementGroup,
} from '@/src/requirements/util';
import { SemesterDisplayProps } from '@/components/YearSchedule/SemesterColumn/SemesterColumn';
import { breakpoints, classNames, useBreakpoint } from '@/src/utils/styles';
import Layout from '@/components/Layout/Layout';
import { Footer } from '@/components/Layout/Footer';
import Navbar from '@/components/Layout/Navbar';
import { SemestersList } from '@/components/YearSchedule/PlanningSection';
import HiddenSchedules from '@/components/YearSchedule/HiddenSchedules';
import HeaderSection from '@/components/YearSchedule/HeaderSection';
import RequirementsSection from '@/components/YearSchedule/RequirementsSection';
import ClassesCloud from '@/components/ClassesCloudPage/ClassesCloudPage';
import { signInUser } from '@/components/Layout/useSyncAuth';
import useSyncSchedulesMatchingContraints from '@/src/utils/schedules';
import { where } from 'firebase/firestore';
import { useColumns } from '../components/YearSchedule/useColumns';

export default function PlanPage() {
  const userId = Auth.useAuthProperty('uid');
  const showReqs = useAppSelector(Planner.selectShowReqs);
  const md = useBreakpoint(breakpoints.md);
  const columns = useColumns();

  const [selectedRequirements, setSelectedRequirements] = useState<RequirementGroup>(collegeRequirements);
  const [highlightedRequirement, setHighlightedRequirement] = useState<Requirement>();

  const validationResults = useValidateSchedule(selectedRequirements);

  if (!userId) {
    return (
      <ClassesCloud controls="track">
        <button
          type="button"
          className="relative text-3xl font-black text-white drop-shadow-lg transition-opacity hover:opacity-80 sm:text-6xl"
          onClick={() => signInUser().catch(alertUnexpectedError)}
        >
          Sign in to get started!
        </button>
      </ClassesCloud>
    );
  }


  // className={classNames(
  //   showReqs && 'md:p-8 md:grid-rows-1 md:grid-cols-[auto_1fr] items-stretch',
  //   'w-full grid gap-4 min-h-screen',
  // )}

  if (!md) {
    return (
      <Layout title="Plan" custom>
        <ScheduleSyncer userId={userId} />
        <div className="flex min-h-screen flex-col">
          <Navbar />

          <BodySection
            columns={columns}
            showReqs={showReqs}
            highlightedRequirement={highlightedRequirement}
          />
        </div>

        {showReqs && (
        <RequirementsSection
          {...{
            selectedRequirements,
            setSelectedRequirements,
            highlightRequirement: setHighlightedRequirement,
            highlightedRequirement,
            validationResults,
          }}
        />
        )}

        <Footer />
      </Layout>
    );
  }

  return (
    <Layout title="Plan" className="flex flex-1 flex-row-reverse">
      <ScheduleSyncer userId={userId} />
      <BodySection
        columns={columns}
        showReqs={showReqs}
        highlightedRequirement={highlightedRequirement}
      />

      {showReqs && (
      <RequirementsSection
        {...{
          selectedRequirements,
          setSelectedRequirements,
          highlightRequirement: setHighlightedRequirement,
          highlightedRequirement,
          validationResults,
        }}
      />
      )}
    </Layout>
  );
}

function useValidateSchedule(selectedRequirements: RequirementGroup) {
  const profile = useAppSelector(Profile.selectUserProfile);
  const semesterFormat = useAppSelector(Planner.selectSemesterFormat);
  const sampleSchedule = useAppSelector(Planner.selectSampleSchedule);
  const chosenSchedules = useAppSelector(Settings.selectChosenSchedules);
  const schedules = useAppSelector(Schedules.selectSchedules);
  const classCache = useAppSelector(ClassCache.selectClassCache);

  const [validationResults, setValidationResults] = useState<GroupResult | null>(null);

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
  }, [selectedRequirements, classCache, sampleSchedule, semesterFormat, profile, chosenSchedules, schedules]);

  return validationResults;
}

function BodySection({
  showReqs, columns, highlightedRequirement,
}: {
  showReqs: boolean, columns: SemesterDisplayProps[], highlightedRequirement?: Requirement
}) {
  const resizeRef = useRef<HTMLDivElement>(null!);

  return (
    <div className={classNames(
      'flex-1 flex flex-col relative bg-black md:p-4',
      showReqs && 'md:rounded-lg md:shadow-lg',
    )}
    >
      <HeaderSection resizeRef={resizeRef} columns={columns} />
      <SemestersList
        highlightedRequirement={highlightedRequirement}
        resizeRef={resizeRef}
        columns={columns}
      />
      <HiddenSchedules />
    </div>
  );
}

function ScheduleSyncer({ userId }: { userId: string; }) {
  const constraints = useMemo(() => [where('ownerUid', '==', userId)], [userId]);
  useSyncSchedulesMatchingContraints(constraints);
  return null;
}
