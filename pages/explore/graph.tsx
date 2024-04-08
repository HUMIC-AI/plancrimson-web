import {
  useEffect, useMemo, useRef, useState,
} from 'react';
import { useCourseEmbeddingData } from '../../components/ClassesCloudPage/useData';
import {
  ExtendedClass,
  getUpcomingSemester,
} from '../../src/lib';
import Layout from '../../components/Layout/Layout';
import { Auth, ClassCache, Schedules } from '../../src/features';
import { AuthRequiredInstantSearchProvider } from '../../components/AuthRequiredInstantSearchProvider';
import { WithMeili } from '../../components/Layout/WithMeili';
import { SearchStateProvider, getDefaultSearchStateForSemester } from '../../src/context/searchState';
import SearchBox from '../../components/SearchComponents/SearchBox/SearchBox';
import Hits from '../../components/SearchComponents/Hits';
import { useAppDispatch, useAppSelector } from '../../src/utils/hooks';
import { ChosenScheduleContext, ChosenScheduleContextType } from '../../src/context/selectedSchedule';
import { DatumBase, useUpdateGraph } from '../../components/initGraph';
import { InfoCard, InfoCardProps } from '../../components/Modals/InfoCard';
import { getCourseModalContent } from '../../components/Modals/CourseCardModal';
import { useMeiliClient } from '../../src/context/meili';


export default function GraphPage() {
  const userId = Auth.useAuthProperty('uid');
  const [hoveredClassId, setHoveredClassId] = useState<string | null>(null);

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
            <Graph onHover={(id) => id && setHoveredClassId(id)} />
            <HoveredCourseInfo courseId={hoveredClassId} />
          </div>
        </ChosenScheduleContext.Provider>
      </WithMeili>
    </Layout>
  );
}

function HoveredCourseInfo({ courseId }: {
  courseId: string | null;
}) {
  const dispatch = useAppDispatch();
  const { client } = useMeiliClient();
  const [course, setCourse] = useState<ExtendedClass>();

  useEffect(() => {
    if (!courseId) {
      setCourse(undefined);
      return;
    }

    dispatch(ClassCache.loadCourses(client, [courseId]))
      .then(([response]) => {
        setCourse(response);
      })
      .catch((e) => {
        console.error(e);
      });
  }, [courseId, client, dispatch]);

  const props = useMemo(() => {
    if (course) {
      return getCourseModalContent(course);
    }

    const modalProps: Partial<InfoCardProps> = {
      title: 'Hover over a course to see more information',
      headerContent: 'Click a course to browse similar ones',
      content: (
        <div className="space-y-2 p-6">
          <p>
            The size of each dot indicates the typical number of students.
          </p>
          <p>
            The
            {' '}
            <strong>saturation</strong>
            {' '}
            indicates the mean number of hours.
          </p>
          <p>
            The
            {' '}
            <strong>opacity</strong>
            {' '}
            indicates the average rating.
          </p>
        </div>
      ),
    };

    return modalProps;
  }, [course]);

  return <InfoCard small isDialog={false} noExit {...props} />;
}

function SearchSection() {
  return (
    <SearchStateProvider oneCol defaultState={getDefaultSearchStateForSemester(getUpcomingSemester())} ignoreUrl>
      <AuthRequiredInstantSearchProvider hitsPerPage={4}>
        <div className="relative inset-y-0 flex w-64 flex-col space-y-4 overflow-hidden">
          <SearchBox scheduleChooser={false} showSmallAttributeMenu />
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
function Graph({
  onHover,
}: {
  onHover: (id: string | null) => void;
}) {
  const { positions, courses } = useCourseEmbeddingData('all', undefined, 'pca');
  const {
    update, remove, reset, ref,
  } = useUpdateGraph(positions, courses, onHover);
  const dispatch = useAppDispatch();
  const chosenSchedule = useAppSelector(Schedules.selectSchedule('GRAPH_SCHEDULE'));
  const prevIds = useRef<string[]>();

  const width = 800;
  const height = 800;

  useEffect(() => {
    if (!chosenSchedule?.classes || !positions || !courses || !update || !remove) return;

    const nodes: DatumBase[] = chosenSchedule.classes.map((id) => {
      const courseBrief = courses.find((c) => c.id === id)!;
      return {
        ...courseBrief,
        pca: positions[courseBrief.i],
      };
    });

    update(nodes, []);
    if (prevIds.current) {
      const removed = prevIds.current.filter((id) => !chosenSchedule.classes.includes(id));
      remove(removed);
    }
    prevIds.current = [...chosenSchedule.classes];
  }, [chosenSchedule?.classes, courses, positions, remove, update]);

  return (
    <div className="relative flex-1">
      <svg
        ref={ref}
        width={width}
        height={height}
        viewBox={`${-width / 2} ${-height / 2} ${width} ${height}`}
        className="h-auto w-full"
      />
      <button
        type="button"
        className="absolute right-2 top-2 flex items-center justify-center rounded px-2 py-1 transition hover:bg-gray-primary/50"
        onClick={() => {
          if (reset) reset();
          dispatch(Schedules.clearSchedule('GRAPH_SCHEDULE'));
        }}
      >
        Reset
      </button>
    </div>
  );
}
