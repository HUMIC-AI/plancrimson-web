import { useMemo } from 'react';
import Confetti from 'react-confetti';
import Layout from '../../components/Layout/Layout';
import { WithMeili } from '../../components/Layout/WithMeili';
import { AuthRequiredInstantSearchProvider } from '../../components/Utils/AuthRequiredInstantSearchProvider';
import { ScheduleSyncer } from '../../components/Utils/ScheduleSyncer';
import { GraphProvider, useGraphContext } from '../../src/context/GraphProvider';
import { ScheduleProvider } from '../../src/context/ScheduleProvider';
import { SearchStateProvider } from '../../src/context/searchState';
import { GRAPH_SCHEDULE } from '../../src/features/schedules';
import { Auth } from '../../src/features';
import { useBreakpoint, breakpoints } from '../../src/utils/styles';
import { SidebarPanel } from '../../components/ExploreGraph/CollapsibleSidebar';
import { ExploreGraph } from '../../components/ExploreGraph/ExploreGraph';
import { HoveredCourseInfo } from '../../components/ExploreGraph/HoveredCourseInfo';
import { InfoCard, InfoCardProps } from '../../components/Modals/InfoCard';
import { getCourseModalContent } from '../../components/Modals/CourseCardModal';
import { useCourse } from '../../src/features/classCache';

export default function GamePage() {
  const userId = Auth.useAuthProperty('uid');
  const isLg = useBreakpoint(breakpoints.lg);

  if (!isLg) {
    return (
      <Layout title="Graph" className="relative w-full flex-1 bg-secondary">
        <div className="flex flex-1 items-center justify-center">
          <p className="text-center">
            The graph is not available on small screens.
            <br />
            Please use a larger screen to explore the graph.
          </p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout
      title="Game"
      className="relative w-full flex-1 overflow-hidden bg-secondary"
      headerStyles="bg-secondary/50 text-primary absolute inset-x-0 z-10 hover:bg-secondary/80 transition-colors"
    >
      <WithMeili userId={userId}>
        {userId && <ScheduleSyncer userId={userId} />}
        {/* <GraphDragDropProvider> */}
        <ScheduleProvider id={GRAPH_SCHEDULE}>
          <SearchStateProvider defaultState={null} ignoreUrl>
            {/* more hits per page for better filter matching experience */}
            <AuthRequiredInstantSearchProvider indexName="courses" hitsPerPage={2}>
              <GraphProvider scheduleId={null} playGame>
                <Contents />
              </GraphProvider>
            </AuthRequiredInstantSearchProvider>
          </SearchStateProvider>
        </ScheduleProvider>
        {/* </GraphDragDropProvider> */}
      </WithMeili>
    </Layout>
  );
}

function Contents() {
  const { graph, victory } = useGraphContext();
  const course = useCourse(graph?.target?.id ?? null);
  const props = useMemo<InfoCardProps | null>(() => {
    if (!course) return null;
    const { close, title, ...p } = getCourseModalContent(course);
    return { ...p, title: `TARGET: ${title}`, isDialog: false };
  }, [course]);

  return (
    <>
      {victory && <Confetti />}
      <ExploreGraph />
      {props && (
      <SidebarPanel side="left">
        <InfoCard {...props} />
      </SidebarPanel>
      )}
      <SidebarPanel side="right">
        <HoveredCourseInfo />
      </SidebarPanel>
    </>
  );
}

