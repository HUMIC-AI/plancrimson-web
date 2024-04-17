import { useRef, useState } from 'react';
import Layout from '../Layout/Layout';
import { Auth } from '../../src/features';
import { WithMeili } from '../Layout/WithMeili';
import { ScheduleIdProvider } from '../../src/context/selectedSchedule';
import { breakpoints, useBreakpoint } from '../../src/utils/styles';
import { HoveredCourseInfo } from './HoveredCourseInfo';
import { ExplorePageCourseSearchSection } from './ExplorePageCourseSearchSection';
import { ExploreGraph } from './ExploreGraph';
import { GRAPH_SCHEDULE } from '../../src/features/schedules';
import { SidebarPanel } from './CollapsibleSidebar';
import { ScheduleSyncer } from '../Utils/ScheduleSyncer';

export function GraphPage({ scheduleId }: { scheduleId?: string; }) {
  const userId = Auth.useAuthProperty('uid');
  const [hoveredClassId, setHoveredClassId] = useState<string | null>(null);
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
        <ScheduleIdProvider id={GRAPH_SCHEDULE}>
          {/* three main components: the background graph, the left search bar, the right course info */}
          <ExploreGraph
            scheduleId={scheduleId ?? null}
            setHover={setHoveredClassId}
            panelRef={courseInfoRef}
          />

          {/* left sidebar (add courses to graph schedule) */}
          <SidebarPanel side="left" defaultOpen>
            <ExplorePageCourseSearchSection />
          </SidebarPanel>
        </ScheduleIdProvider>

        <SidebarPanel ref={courseInfoRef} side="right" defaultOpen>
          <HoveredCourseInfo courseId={hoveredClassId} />
        </SidebarPanel>
      </WithMeili>
    </Layout>
  );
}
