import {
  useState, useRef,
} from 'react';
import {
  Auth, Planner,
} from '@/src/features';
import {
  alertUnexpectedError, useAppSelector,
} from '@/src/utils/hooks';
import collegeRequirements from '@/src/requirements/college';
import {
  Requirement,
  RequirementGroup,
} from '@/src/requirements/util';
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
import type { ListOfScheduleIdOrSemester } from '@/src/types';
import { useColumns } from '../components/YearSchedule/useColumns';
import { ScheduleSyncer } from '../components/ScheduleSyncer';
import { useValidateSchedule } from '../components/YearSchedule/useValidateSchedule';

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

  const requirementsSectionProps = {
    selectedRequirements,
    setSelectedRequirements,
    highlightRequirement: setHighlightedRequirement,
    highlightedRequirement,
    validationResults,
  };

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

        {showReqs && <RequirementsSection {...requirementsSectionProps} />}

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

      {showReqs && <RequirementsSection {...requirementsSectionProps} />}
    </Layout>
  );
}

type Props = {
  showReqs: boolean;
  columns: ListOfScheduleIdOrSemester;
  highlightedRequirement?: Requirement
};

function BodySection({
  showReqs, columns, highlightedRequirement,
}: Props) {
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


