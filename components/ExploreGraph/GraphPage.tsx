import { useMemo, useRef, useState } from 'react';
import Layout from '../Layout/Layout';
import { Auth } from '../../src/features';
import { WithMeili } from '../Layout/WithMeili';
import { ChosenScheduleContext, ChosenScheduleContextType } from '../../src/context/selectedSchedule';
import { breakpoints, useBreakpoint } from '../../src/utils/styles';
import { HoveredCourseInfo } from './HoveredCourseInfo';
import { ExplorePageCourseSearchSection } from './ExplorePageCourseSearchSection';
import { ExploreGraph } from './ExploreGraph';
import { signInUser } from '../Layout/useSyncAuth';
import { ScheduleSyncer } from '../Utils/ScheduleSyncer';
import { GRAPH_SCHEDULE } from '../../src/features/schedules';
import { SidebarPanel } from './CollapsibleSidebar';

export function GraphPage({ scheduleId }: { scheduleId?: string; }) {
  const userId = Auth.useAuthProperty('uid');
  const [hoveredClassId, setHoveredClassId] = useState<string | null>(null);
  const courseInfoRef = useRef<HTMLDivElement>(null);

  const chosenScheduleContext = useMemo((): ChosenScheduleContextType => ({
    chooseSchedule: () => null,
    chosenScheduleId: GRAPH_SCHEDULE,
  }), []);

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
        {userId && <ScheduleSyncer userId={userId} scheduleId={scheduleId} />}

        <ChosenScheduleContext.Provider value={chosenScheduleContext}>
          {/* three main components: the background graph, the left search bar, the right course info */}
          {userId ? (
            <ExploreGraph
              scheduleId={scheduleId}
              setHover={setHoveredClassId}
              panelRef={courseInfoRef}
            />
          ) : <NoGraphMessage />}
          <SidebarPanel side="left">
            <ExplorePageCourseSearchSection />
          </SidebarPanel>
          <SidebarPanel ref={courseInfoRef} side="right" defaultOpen>
            <HoveredCourseInfo courseId={hoveredClassId} />
          </SidebarPanel>
        </ChosenScheduleContext.Provider>
      </WithMeili>
    </Layout>
  );
}

function NoGraphMessage() {
  return (
    <button
      type="button"
      onClick={() => signInUser().catch((err) => console.error(err))}
      className="interactive secondary absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-lg px-4 py-2 font-medium"
    >
      Sign in to explore the graph!
    </button>
  );
}