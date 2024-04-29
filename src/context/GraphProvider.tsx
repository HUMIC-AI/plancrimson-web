import {
  PropsWithChildren, createContext, useEffect, useMemo, useRef, useState,
} from 'react';
import { connectInfiniteHits } from 'react-instantsearch-dom';
import type { InfiniteHitsProvided } from 'react-instantsearch-core';
import {
  Explanation, Graph, GraphPhase, GraphTool, RatingField,
} from '../../components/ExploreGraph/Graph';
import { ExtendedClass, Subject, getUpcomingSemester } from '../lib';
import { useCourseEmbeddingData } from '../../components/ClassesCloudPage/useData';
import { signInUser } from '../../components/Layout/useSyncAuth';
import { Auth, Schedules, ClassCache } from '../features';
import { GRAPH_SCHEDULE } from '../features/schedules';
import {
  useElapsed, useAppDispatch, useAppSelector, alertUnexpectedError,
} from '../utils/hooks';
import { useClasses } from '../utils/schedules';
import { getRandomRatedCourse, useAssertContext } from '../utils/utils';
import { useMeiliClient } from './meili';
import { useModal } from './modal';
import useClientOrDemo from '../../components/SearchComponents/ClientOrDemo';

type Provided = Pick<InfiniteHitsProvided<ExtendedClass>, 'hits' | 'hasMore' | 'refineNext'>;

type Exposed = {
  scheduleId: string | null;
  instructions?: boolean;
};

const GraphContext = createContext<ReturnType<typeof useGraphState> | null>(null);

/**
 * Need to be careful with two way synchronization between redux store
 * GRAPH_SCHEDULE and the graph's internal nodes and links.
 */
function useGraphState({
  scheduleId,
  hits,
  hasMore,
  instructions: gameMode,
  refineNext,
}: Provided & Exposed) {
  // react state to ensure rerenders when graph state changes
  const [hoveredClassId, setHover] = useState<string | null>(null);
  const [mode, setMode] = useState<GraphTool>('Add similar');
  const [phase, setPhase] = useState<GraphPhase>('init');
  const [explanation, setExplanation] = useState<Explanation | null>(null);
  const [matchFilter, setMatchFilter] = useState<boolean>(false);
  const [ratingType, setRatingType] = useState<RatingField>('meanRating');
  const [subjects, setSubjects] = useState<Subject[]>([]);

  const { positions, courses } = useCourseEmbeddingData('all', undefined, 'pca');
  const { showContents, goBack } = useModal();
  const userId = Auth.useAuthProperty('uid');
  const elapsed = useElapsed(1000, []);

  const dispatch = useAppDispatch();
  const graphSchedule = useAppSelector(Schedules.selectSchedule(GRAPH_SCHEDULE));
  const fixedClasses = useClasses(scheduleId);

  // refs for fine grained control
  const { client } = useMeiliClient();
  const ref = useRef<SVGSVGElement>(null);
  const tooltipRef = useRef<HTMLParagraphElement>(null);
  const graphRef = useRef<Graph>();

  useEffect(() => {
    // only initialize graph after all data is included and 500ms has passed
    if (graphRef.current || !courses || !elapsed || !fixedClasses || !positions || !ref.current || !tooltipRef.current) return;

    console.info('initializing graph');

    const initialCourses = fixedClasses.length === 0 ? [getRandomRatedCourse(courses)] : [];

    // ask user to sign in if they haven't already
    const showInstructions = userId
      ? (gameMode ? () => {
        if (initialCourses.length !== 1) {
          throw new Error('Game environment should not have any fixed classes');
        }

        const initial = initialCourses[0];

        showContents({
          title: 'Exploration Game',
          close: 'none',
          content: (
            <div className="flex flex-col space-y-2 p-6">
              <p>
                Welcome to the course exploration game!
              </p>
              <p>
                Your goal is to get from the origin course to the target course as quickly as possible
                by hopping from course to course.
              </p>
              <p>
                Your origin course is
                {' '}
                <strong>
                  {initial.subject + initial.catalog}
                </strong>
                .
              </p>
              <p>
                Your target course is
                {' '}
                <strong>
                  {graphRef.current!.target!.subject + graphRef.current!.target!.catalog}
                </strong>
                .
              </p>
              <p>
                Good luck and have fun!
              </p>
              <button
                type="button"
                onClick={() => {
                  goBack();
                  graphRef.current!.cleanupClickMe();
                  graphRef.current!.setPhase('ready');
                }}
                className="button secondary mx-auto"
              >
                Begin
              </button>
            </div>
          ),
        });
      } : null)
      : () => {
        console.info('showing graph instructions');
        showContents({
          title: 'Course Explorer',
          close: 'none',
          content: (
            <div className="flex items-center justify-center p-6">
              <button
                type="button"
                onClick={() => signInUser().then(() => {
                  goBack();
                  graphRef.current!.cleanupClickMe();
                  graphRef.current!.setPhase('ready');
                }).catch(alertUnexpectedError)}
                className="button secondary"
              >
                Sign in to explore the graph!
              </button>
            </div>
          ),
        });
      };

    graphRef.current = new Graph(
      ref.current,
      tooltipRef.current,
      (ids: string[]) => (client ? dispatch(ClassCache.loadCourses(client, ids)) : Promise.resolve([])),
      positions,
      courses,
      scheduleId,
      gameMode ? getRandomRatedCourse(courses) : null,
      mode,
      setMode,
      setHover,
      setSubjects,
      setExplanation,
      ratingType,
      setRatingType,
      showInstructions,
      (ids: string[], id: string) => dispatch(Schedules.addCourses({ scheduleId: id, courseIds: ids })),
      (ids: string[], id: string) => dispatch(Schedules.removeCourses({ scheduleId: id, courseIds: ids })),
      setPhase,
      hits,
      matchFilter,
      setMatchFilter,
      hasMore,
      refineNext,
    );

    dispatch(Schedules.createLocal({
      id: GRAPH_SCHEDULE,
      title: 'Graph Schedule',
      createdAt: new Date().toISOString(),
      ownerUid: 'GRAPH_USER',
      public: false,
      classes: [],
      ...getUpcomingSemester(),
    }));

    graphRef.current.syncCourses(initialCourses.map((d) => d.id), fixedClasses);
  // start the graph once these variables exist (checked at top of useEffect)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courses, elapsed, fixedClasses, positions]);

  // whenever GRAPH_SCHEDULE is updated, update the graph nodes
  useEffect(() => {
    if (!graphRef.current || !graphSchedule?.classes || !fixedClasses || !courses || !positions) return;
    graphRef.current.syncCourses(graphSchedule.classes, fixedClasses);
  }, [courses, fixedClasses, graphSchedule?.classes, positions]);

  // stop simulation when unmounting
  useEffect(() => () => {
    if (graphRef.current) {
      console.info('stopping graph');
      graphRef.current.sim.stop();
      dispatch(Schedules.deleteSchedule(GRAPH_SCHEDULE));
    }
  }, [dispatch]);

  // to handle closing the explanation
  useEffect(() => {
    if (explanation === null && graphRef.current) {
      graphRef.current.clearExplanation();
    }
  }, [explanation]);

  useEffect(() => {
    if (graphRef.current) {
      graphRef.current.setHits(hits);
      graphRef.current.setHasMore(hasMore);
      graphRef.current.setRefineNext(refineNext);
    }
  }, [hits, hasMore, refineNext]);

  // update using graph methods
  // rerender whenever these dependencies change
  const context = useMemo(() => ({
    graph: graphRef.current,
    ref,
    tooltipRef,
    hoveredClassId,
    mode,
    explanation,
    setExplanation,
    ratingType,
    matchFilter,
    phase,
    subjects,
    elapsed,
    graphSchedule,
  }), [hoveredClassId, mode, matchFilter, ratingType, explanation, phase, subjects, elapsed, graphSchedule]);

  return context;
}

// This is a separate component for TypeScript convenience
function GraphProviderComponent({ children, ...props }: PropsWithChildren<Provided & Exposed>) {
  const context = useGraphState(props);

  return (
    <GraphContext.Provider value={context}>
      {children}
    </GraphContext.Provider>
  );
}

export function GraphProvider({ children, ...props }: PropsWithChildren<Exposed>) {
  const Component = useClientOrDemo<Provided, Exposed>(
    connectInfiniteHits as any,
    GraphProviderComponent,
  );
  return <Component {...props}>{children}</Component>;
}

export const useGraphContext = () => useAssertContext(GraphContext);
