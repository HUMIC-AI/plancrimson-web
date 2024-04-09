import { useRef, useState } from 'react';
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
import Layout, { HeadMeta, description } from '../Layout/Layout';
import Navbar from '../Layout/Navbar';
import { ScheduleSyncer } from '../ScheduleSyncer';
import RequirementsSection from './RequirementsSection';
import { useValidateSchedule } from './useValidateSchedule';
import { WithMeili } from '../Layout/WithMeili';
import InstructionsModal from './InstructionsModal';

export default function ({ userId }: { userId: string; }) {
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
      <>
        <HeadMeta pageTitle="Plan" description={description} />
        <ScheduleSyncer userId={userId} />

        <div className="flex min-h-screen flex-col">
          <Navbar />

          <WithMeili userId={userId}>
            <BodySection
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

  return (
    <Layout title="Plan" className="flex flex-1 flex-row-reverse" verify="meili">
      {() => (
        <>
          <ScheduleSyncer userId={userId} />

          <BodySection
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
};

function BodySection({
  showReqs, highlightedRequirement,
}: Props) {
  const resizeRef = useRef<HTMLDivElement>(null!);
  const columns = useColumns();

  return (
    <div className={classNames(
      'flex-1 flex flex-col relative md:p-4 primary',
      showReqs && 'md:rounded-lg md:shadow-lg',
    )}
    >
      <InstructionsModal />

      <PlanningPageHeaderSection resizeRef={resizeRef} columns={columns} />

      <SemestersList
        highlightedRequirement={highlightedRequirement}
        resizeRef={resizeRef}
        columns={columns}
      />

      <HiddenSchedules />
    </div>
  );
}
