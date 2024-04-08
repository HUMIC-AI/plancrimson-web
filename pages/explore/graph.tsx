import {
  useMemo, useRef, useState,
} from 'react';
import Layout from '../../components/Layout/Layout';
import { Auth } from '../../src/features';
import { WithMeili } from '../../components/Layout/WithMeili';
import { ChosenScheduleContext, ChosenScheduleContextType } from '../../src/context/selectedSchedule';
import { signInUser } from '../../components/Layout/useSyncAuth';
import { breakpoints, useBreakpoint } from '../../src/utils/styles';
import { HoveredCourseInfo } from '../../components/ExploreGraph/HoveredCourseInfo';
import { ExplorePageCourseSearchSection } from '../../components/ExploreGraph/ExplorePageCourseSearchSection';
import { Graph } from '../../components/ExploreGraph/ExploreGraph';


export default function GraphPage() {
  const userId = Auth.useAuthProperty('uid');
  const [hoveredClassId, setHoveredClassId] = useState<string | null>(null);
  const [fixedClassId, setFixedClassId] = useState<string | null>(null);
  const courseInfoRef = useRef<HTMLDivElement>(null);

  const chosenScheduleContext = useMemo((): ChosenScheduleContextType => ({
    chooseSchedule: () => null,
    chosenScheduleId: 'GRAPH_SCHEDULE',
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
      className="relative w-full flex-1 bg-secondary"
      headerStyles="bg-secondary/50 text-primary absolute inset-x-0 z-10 hover:bg-secondary/80 transition-colors"
    >
      <WithMeili userId={userId}>
        <ChosenScheduleContext.Provider value={chosenScheduleContext}>
          {/* three main components: the background graph, the left search bar, the right course info */}
          {userId ? (
            <Graph
              onHover={(id) => id && setHoveredClassId(id)}
              onFix={setFixedClassId}
              panelRef={courseInfoRef}
            />
          ) : <NoGraphMessage />}
          <ExplorePageCourseSearchSection />
          <HoveredCourseInfo ref={courseInfoRef} courseId={fixedClassId ?? hoveredClassId} />
        </ChosenScheduleContext.Provider>
      </WithMeili>
    </Layout>
  );
}

function NoGraphMessage() {
  return (
    <div className="flex flex-1 items-center justify-center">
      <button
        type="button"
        onClick={() => signInUser().catch((err) => console.error(err))}
        className="interactive font-medium"
      >
        Sign in to explore the graph!
      </button>
    </div>
  );
}
