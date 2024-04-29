import Layout from '../Layout/Layout';
import { Auth } from '../../src/features';
import { WithMeili } from '../Layout/WithMeili';
import { ScheduleProvider } from '../../src/context/ScheduleProvider';
import { breakpoints, useBreakpoint } from '../../src/utils/styles';
import { HoveredCourseInfo } from './HoveredCourseInfo';
import { ExploreGraph } from './ExploreGraph';
import { GRAPH_SCHEDULE } from '../../src/features/schedules';
import { SidebarPanel } from './CollapsibleSidebar';
import { ScheduleSyncer } from '../Utils/ScheduleSyncer';
import { GraphProvider, useGraphContext } from '../../src/context/GraphProvider';
// import { GraphDragDropProvider } from '../../src/context/DragCourseMoveSchedulesProvider';
import { useDefaultSearchState, SearchStateProvider } from '../../src/context/searchState';
import CourseCardStyleProvider from '../../src/context/CourseCardStyleProvider';
import { AuthRequiredInstantSearchProvider } from '../Utils/AuthRequiredInstantSearchProvider';
import SearchBox from '../SearchComponents/SearchBox/SearchBox';
import CurrentRefinements from '../SearchComponents/CurrentRefinements';
import Hits from '../SearchComponents/Hits';

export function GraphPage({ scheduleId }: { scheduleId?: string; }) {
  const defaultState = useDefaultSearchState();
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
      title="Graph"
      className="relative w-full flex-1 overflow-hidden bg-secondary"
      headerStyles="bg-secondary/50 text-primary absolute inset-x-0 z-10 hover:bg-secondary/80 transition-colors"
    >
      <WithMeili userId={userId}>
        {userId && <ScheduleSyncer userId={userId} />}
        {/* <GraphDragDropProvider> */}
        <ScheduleProvider id={GRAPH_SCHEDULE}>
          <SearchStateProvider defaultState={defaultState} ignoreUrl>
            {/* more hits per page for better filter matching experience */}
            <AuthRequiredInstantSearchProvider indexName="courses" hitsPerPage={20}>
              <GraphProvider scheduleId={scheduleId ?? null}>
                <Container />
              </GraphProvider>
            </AuthRequiredInstantSearchProvider>
          </SearchStateProvider>
        </ScheduleProvider>
        {/* </GraphDragDropProvider> */}
      </WithMeili>
    </Layout>
  );
}

// needs to go inside graph provider
function Container() {
  const { graph, phase } = useGraphContext();
  return (
    <CourseCardStyleProvider
      defaultStyle="collapsed"
      clickWholeCard
      columns={1}
      disableClick={phase !== 'ready'}
      hover={phase === 'ready' && graph ? {
        filter(course) {
          return graph.canReplaceHover && typeof graph.findTitle({ catalog: course.CATALOG_NBR, subject: course.SUBJECT }) !== 'undefined';
        },
        onHover(course) {
          const node = graph.findTitle({ catalog: course.CATALOG_NBR, subject: course.SUBJECT });
          if (node) {
            graph.focusCourse(node.id, 'hover');
          }
        },
      } : undefined}
    >
      {/* three main components: the background graph, the left search bar, the right course info */}
      <ExploreGraph />

      {/* left sidebar (add courses to graph schedule) */}
      <SidebarPanel side="left" defaultOpen showLink>
        {/* static positioning!!! happy */}
        <div className="mx-2 space-y-4 rounded-xl py-6 text-xs transition-colors hover:bg-secondary/50">
          <SearchBox scheduleChooser={false} showSmallAttributeMenu showStats={false} />
          <div className="grid grid-cols-[auto_1fr] items-center gap-2">
            <CurrentRefinements />
          </div>
          <Hits concise />
        </div>
      </SidebarPanel>
      <SidebarPanel side="right" defaultOpen>
        <HoveredCourseInfo />
      </SidebarPanel>
    </CourseCardStyleProvider>
  );
}

