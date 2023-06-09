import { useRef, useState } from 'react';
import { Requirement, RequirementGroup } from '@/src/requirements/util';
import { breakpoints, classNames, useBreakpoint } from '@/src/utils/styles';
import { SemestersList } from '@/components/YearSchedule/PlanningSection';
import HiddenSchedules from '@/components/YearSchedule/HiddenSchedules';
import HeaderSection from '@/components/YearSchedule/HeaderSection';
import { useColumns } from '@/components/YearSchedule/useColumns';
import { Planner } from '@/src/features';
import collegeRequirements from '@/src/requirements/college';
import { useAppSelector } from '@/src/utils/hooks';
import CustomModal from '../CustomModal';
import { Footer } from '../Layout/Footer';
import Layout, { HeadMeta, description } from '../Layout/Layout';
import Navbar from '../Layout/Navbar';
import { ScheduleSyncer } from '../ScheduleSyncer';
import RequirementsSection from './RequirementsSection';
import { useValidateSchedule } from './useValidateSchedule';
import { WithMeili } from '../Layout/WithMeili';

export default function IndexPage({ userId }: { userId: string; }) {
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
      <WithMeili enabled>
        <HeadMeta pageTitle="Plan" description={description} />
        <ScheduleSyncer userId={userId} />

        <div className="flex min-h-screen flex-col">
          <Navbar />

          <BodySection
            showReqs={showReqs}
            highlightedRequirement={highlightedRequirement}
          />
        </div>

        {showReqs && <RequirementsSection {...requirementsSectionProps} />}

        <Footer />

        <CustomModal />
      </WithMeili>
    );
  }

  return (
    <Layout title="Plan" className="flex flex-1 flex-row-reverse" withMeili>
      <ScheduleSyncer userId={userId} />
      <BodySection
        showReqs={showReqs}
        highlightedRequirement={highlightedRequirement}
      />

      {showReqs && <RequirementsSection {...requirementsSectionProps} />}
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
      'flex-1 flex flex-col relative md:p-4 bg-secondary text-primary',
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
