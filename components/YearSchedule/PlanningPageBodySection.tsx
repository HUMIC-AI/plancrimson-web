import { useMemo, useRef, useState } from 'react';
import { Requirement, RequirementGroup } from '@/src/requirements/util';
import { breakpoints, classNames, useBreakpoint } from '@/src/utils/styles';
import { SemestersList } from '@/components/YearSchedule/PlanningSection';
import HiddenSchedules from '@/components/YearSchedule/HiddenSchedules';
import PlanningPageHeaderSection from '@/components/YearSchedule/HeaderSection';
import { useColumns } from '@/components/YearSchedule/useColumns';
import { Planner } from '@/src/features';
import collegeRequirements from '@/src/requirements/college';
import { useAppSelector } from '@/src/utils/hooks';
import CustomModal from '../Modals/CustomModal';
import { Footer } from '../Layout/Footer';
import Layout, { HeadMeta } from '../Layout/Layout';
import { Navbar } from '../Layout/Navbar';
import { ScheduleSyncer } from '../Utils/ScheduleSyncer';
import RequirementsSection, { RequirementsSectionProps } from './RequirementsSection';
import { useValidateSchedule } from './useValidateSchedule';
import { WithMeili } from '../Layout/WithMeili';
import { InstructionsModal } from './InstructionsModal';
import { MESSAGES } from '../../src/utils/config';
import CourseCardStyleProvider from '../../src/context/CourseCardStyleProvider';

// keep this default export since it needs to be imported
export default function PlanningPageBodySection({ userId }: { userId: string; }) {
  const showReqs = useAppSelector(Planner.selectShowReqs);
  const md = useBreakpoint(breakpoints.md);
  const [selectedRequirements, setSelectedRequirements] = useState<RequirementGroup>(collegeRequirements);
  const [highlightedRequirement, setHighlightedRequirement] = useState<Requirement>();

  const validationResults = useValidateSchedule(selectedRequirements);

  const requirementsSectionProps = {
    selectedRequirements,
    setSelectedRequirements,
    highlightRequirement: setHighlightedRequirement,
    highlightedRequirement,
    validationResults,
  };

  if (!md) {
    // custom layout for mobile
    return (
      <PlanningPageMobileLayout
        userId={userId}
        showReqs={showReqs}
        highlightedRequirement={highlightedRequirement}
        requirementsSectionProps={requirementsSectionProps}
      />
    );
  }

  return (
    <Layout title="Plan" className="flex flex-1 flex-row-reverse" verify="meili">
      {() => (
        <>
          <BodySection
            userId={userId}
            showReqs={showReqs}
            highlightedRequirement={highlightedRequirement}
          />

          {showReqs && <RequirementsSection {...requirementsSectionProps} />}
        </>
      )}
    </Layout>
  );
}


type Props = {
  showReqs: boolean;
  highlightedRequirement?: Requirement;
  userId: string;
};

function PlanningPageMobileLayout({
  userId, showReqs, highlightedRequirement, requirementsSectionProps,
}: {
  userId: string;
  showReqs: boolean;
  highlightedRequirement: Requirement | undefined;
  requirementsSectionProps: RequirementsSectionProps;
}) {
  return (
    <>
      <HeadMeta pageTitle="Plan">
        {MESSAGES.description}
      </HeadMeta>

      <div className="flex min-h-screen flex-col">
        <Navbar />

        <WithMeili userId={userId}>
          <BodySection
            userId={userId}
            showReqs={showReqs}
            highlightedRequirement={highlightedRequirement}
          />
        </WithMeili>
      </div>

      {showReqs && <RequirementsSection {...requirementsSectionProps} />}

      <Footer />

      <CustomModal />
    </>
  );
}

function BodySection({
  showReqs, highlightedRequirement, userId,
}: Props) {
  const resizeRef = useRef<HTMLDivElement>(null!);
  const columns = useColumns();
  const scheduleIds = useMemo(() => (columns.length > 0 && typeof columns[0] === 'string' ? columns as string[] : undefined), [columns]);

  return (
    <div className={classNames(
      'flex-1 flex flex-col relative md:p-4 primary',
      showReqs && 'md:rounded-lg md:shadow-lg',
    )}
    >
      <ScheduleSyncer
        userId={userId}
        scheduleIds={scheduleIds}
      />

      <CourseCardStyleProvider defaultStyle="collapsed" columns={1} confirmRemoval>
        <InstructionsModal />

        <PlanningPageHeaderSection resizeRef={resizeRef} columns={columns} />

        <SemestersList
          highlightedRequirement={highlightedRequirement}
          resizeRef={resizeRef}
          columns={columns}
        />

        <HiddenSchedules />
      </CourseCardStyleProvider>
    </div>
  );
}
