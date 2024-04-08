import {
  useEffect, useMemo,
} from 'react';
import { useCourseEmbeddingData } from '../../components/ClassesCloudPage/useData';
import {
  getUpcomingSemester,
} from '../../src/lib';
import Layout from '../../components/Layout/Layout';
import { Auth, Schedules } from '../../src/features';
import { AuthRequiredInstantSearchProvider } from '../../components/AuthRequiredInstantSearchProvider';
import { WithMeili } from '../../components/Layout/WithMeili';
import { SearchStateProvider, getDefaultSearchStateForSemester } from '../../src/context/searchState';
import SearchBox from '../../components/SearchComponents/SearchBox/SearchBox';
import Hits from '../../components/SearchComponents/Hits';
import { useAppSelector } from '../../src/utils/hooks';
import { ChosenScheduleContext, ChosenScheduleContextType } from '../../src/context/selectedSchedule';
import { DatumBase, useUpdateGraph } from '../../components/initGraph';


export default function GraphPage() {
  const userId = Auth.useAuthProperty('uid');

  const chosenScheduleContext = useMemo((): ChosenScheduleContextType => ({
    chooseSchedule: () => null,
    chosenScheduleId: 'GRAPH_SCHEDULE',
  }), []);

  return (
    <Layout title="Graph" className="relative w-full flex-1 bg-secondary">
      <WithMeili userId={userId}>
        <ChosenScheduleContext.Provider value={chosenScheduleContext}>
          <div className="absolute inset-2 flex">
            <SearchSection />
            <Graph />
          </div>
        </ChosenScheduleContext.Provider>
      </WithMeili>
    </Layout>
  );
}

function SearchSection() {
  return (
    <SearchStateProvider oneCol defaultState={getDefaultSearchStateForSemester(getUpcomingSemester())} ignoreUrl>
      <AuthRequiredInstantSearchProvider hitsPerPage={4}>
        <div className="relative inset-y-0 flex w-64 flex-col space-y-4 overflow-hidden">
          <SearchBox scheduleChooser={false} />
          <div className="relative flex-1">
            <div className="absolute inset-0 overflow-auto">
              <Hits />
            </div>
          </div>
        </div>
      </AuthRequiredInstantSearchProvider>
    </SearchStateProvider>
  );
}

/**
 * A 2D d3 force graph of different courses.
 */
function Graph() {
  const { positions, courses } = useCourseEmbeddingData('all', undefined, 'pca');
  const { update, ref } = useUpdateGraph(positions, courses);
  const chosenSchedule = useAppSelector(Schedules.selectSchedule('GRAPH_SCHEDULE'));

  const width = 800;
  const height = 800;

  useEffect(() => {
    if (!chosenSchedule?.classes || !positions || !courses || !update) return;

    const nodes: DatumBase[] = chosenSchedule.classes!.map((id) => {
      const courseBrief = courses.find((c) => c.id === id)!;
      return {
        ...courseBrief,
        pca: positions[courseBrief.i],
      };
    });

    update(nodes, []);
  }, [chosenSchedule?.classes, courses, positions, update]);

  return (
    <div className="flex-1">
      <svg
        ref={ref}
        width={width}
        height={height}
        viewBox={`${-width / 2} ${-height / 2} ${width} ${height}`}
        className="h-auto w-full"
      />
    </div>
  );
}
