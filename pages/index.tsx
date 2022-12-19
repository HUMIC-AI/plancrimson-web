import { where } from 'firebase/firestore';
import {
  useState, useEffect, useMemo, useRef,
} from 'react';
import Layout, { Footer } from '../components/Layout/Layout';
import Navbar from '../components/Layout/Navbar';
import { HeaderSection, HiddenSchedules, SemestersList } from '../components/YearSchedule/PlanningSection';
import RequirementsSection from '../components/YearSchedule/RequirementsSection';
import { allTruthy, breakpoints, classNames } from '../shared/util';
import {
  Auth, ClassCache, Planner, Profile, Schedules, Settings,
} from '../src/features';
import {
  handleError, signInUser, useAppSelector, useBreakpoint,
} from '../src/hooks';
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
  const md = useBreakpoint(breakpoints.md);

  const [validationResults, setValidationResults] = useState<GroupResult | null>(null);
  const [selectedRequirements, setSelectedRequirements] = useState<RequirementGroup>(collegeRequirements);
  const [highlightedRequirement, setHighlightedRequirement] = useState<Requirement>();

  const resizeRef = useRef<HTMLDivElement>(null!);

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

  if (!userId) {
    return (
      <Layout className="flex flex-1 items-center justify-center bg-gray-800 p-8" title="Plan">
        <button
          type="button"
          className="interactive text-6xl font-black text-white"
          onClick={() => signInUser().catch(handleError)}
        >
          Sign in to get started!
        </button>
      </Layout>
    );
  }


  // className={classNames(
  //   showReqs && 'md:p-8 md:grid-rows-1 md:grid-cols-[auto_1fr] items-stretch',
  //   'w-full grid gap-4 min-h-screen',
  // )}

  if (!md) {
    return (
      <Layout title="plan" scheduleQueryConstraints={q} custom>
        <div className="flex min-h-screen flex-col">
          <Navbar />

          <div className={classNames(
            'flex-1 flex flex-col relative bg-gray-800 md:p-4',
            showReqs && 'md:rounded-lg md:shadow-lg',
          )}
          >
            <HeaderSection resizeRef={resizeRef} />
            <SemestersList highlightedRequirement={highlightedRequirement} resizeRef={resizeRef} />
            <HiddenSchedules />
          </div>
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
    <Layout title="Plan" scheduleQueryConstraints={q} className="flex flex-1 flex-row-reverse">
      <div className={classNames(
        'flex-1 flex flex-col relative bg-gray-800 md:p-4',
        showReqs && 'md:rounded-lg md:shadow-lg',
      )}
      >
        <HeaderSection resizeRef={resizeRef} />
        <SemestersList highlightedRequirement={highlightedRequirement} resizeRef={resizeRef} />
        <HiddenSchedules />
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
    </Layout>
  );
}
