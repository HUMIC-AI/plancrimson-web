import { useRef } from 'react';
import Layout from '../Layout/Layout';
import { Auth } from '../../src/features';
import { WithMeili } from '../Layout/WithMeili';
import { ScheduleIdProvider } from '../../src/context/selectedSchedule';
import { breakpoints, useBreakpoint } from '../../src/utils/styles';
import { HoveredCourseInfo } from './HoveredCourseInfo';
import { ExploreGraph } from './ExploreGraph';
import { GRAPH_SCHEDULE } from '../../src/features/schedules';
import { SidebarPanel } from './CollapsibleSidebar';
import { ScheduleSyncer } from '../Utils/ScheduleSyncer';
import { GraphProvider } from '../../src/context/GraphProvider';
import { GraphDragDropProvider } from '../../src/context/DragCourseMoveSchedulesProvider';
import { useDefaultSearchState, SearchStateProvider } from '../../src/context/searchState';
import CourseCardStyleProvider from '../../src/context/CourseCardStyleProvider';
import { AuthRequiredInstantSearchProvider } from '../Utils/AuthRequiredInstantSearchProvider';
import SearchBox from '../SearchComponents/SearchBox/SearchBox';
import CurrentRefinements from '../SearchComponents/CurrentRefinements';
import Hits from '../SearchComponents/Hits';

export function GraphPage({ scheduleId }: { scheduleId?: string; }) {
  const defaultState = useDefaultSearchState();
  const userId = Auth.useAuthProperty('uid');
  const courseInfoRef = useRef<HTMLDivElement>(null);
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
        <GraphProvider>
          <GraphDragDropProvider>
            <ScheduleIdProvider id={GRAPH_SCHEDULE}>
              <SearchStateProvider oneCol defaultState={defaultState} ignoreUrl>
                <AuthRequiredInstantSearchProvider indexName="courses">
                  {/* three main components: the background graph, the left search bar, the right course info */}
                  <ExploreGraph
                    scheduleId={scheduleId ?? null}
                    panelRef={courseInfoRef}
                  />

                  {/* left sidebar (add courses to graph schedule) */}
                  <SidebarPanel side="left" defaultOpen>
                    {/* static positioning!!! happy */}
                    <div className="mx-2 space-y-4 rounded-xl py-6 text-xs transition-colors hover:bg-secondary/50">
                      <SearchBox scheduleChooser={false} showSmallAttributeMenu showStats={false} />
                      <div className="grid grid-cols-[auto_1fr] items-center gap-2">
                        <CurrentRefinements />
                      </div>
                      <CourseCardStyleProvider defaultStyle="collapsed">
                        <Hits concise hideToggle />
                      </CourseCardStyleProvider>
                    </div>
                  </SidebarPanel>

                  <SidebarPanel ref={courseInfoRef} side="right" defaultOpen>
                    <HoveredCourseInfo />
                  </SidebarPanel>
                </AuthRequiredInstantSearchProvider>
              </SearchStateProvider>
            </ScheduleIdProvider>
          </GraphDragDropProvider>
        </GraphProvider>
      </WithMeili>
    </Layout>
  );
}
