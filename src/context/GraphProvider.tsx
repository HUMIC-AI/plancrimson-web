import {
  PropsWithChildren, createContext, useEffect, useMemo, useRef, useState,
} from 'react';
import { connectInfiniteHits } from 'react-instantsearch-dom';
import type { InfiniteHitsProvided } from 'react-instantsearch-core';
import { NextRouter, useRouter } from 'next/router';
import {
  Explanation, Graph, GraphPhase, GraphTool, RatingField,
} from '../../components/ExploreGraph/Graph';
import { ExtendedClass, Subject, getUpcomingSemester } from '../lib';
import { CourseBrief, useCourseEmbeddingData } from '../../components/ClassesCloudPage/useData';
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
import { ModalProps } from '../../components/Modals/InfoCard';

type Provided = Pick<InfiniteHitsProvided<ExtendedClass>, 'hits' | 'hasMore' | 'refineNext'>;

type Exposed = {
  scheduleId: string | null;
  playGame?: boolean;
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
  playGame,
  refineNext,
}: Provided & Exposed) {
  // react state to ensure rerenders when graph state changes
  const [hoveredClassId, setHover] = useState<string | null>(null);
  const [tool, setTool] = useState<GraphTool>('Begin');
  const [phase, setPhase] = useState<GraphPhase>('init');
  const [explanation, setExplanation] = useState<Explanation | null>(null);
  const [matchFilter, setMatchFilter] = useState<boolean>(false);
  const [ratingType, setRatingType] = useState<RatingField>('meanRating');
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [victory, setVictory] = useState(false);
  const [victorySeen, setVictorySeen] = useState(false); // ensure it only runs once
  const [showLeftSidebar, setShowLeftSidebar] = useState(false);
  const [showRightSidebar, setShowRightSidebar] = useState(false);

  const router = useRouter();
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

    const initial = getRandomRatedCourse(courses);

    // ask user to sign in if they haven't already
    const showInstructions = userId
      ? (playGame ? () => {
        if (fixedClasses.length !== 0) {
          throw new Error('Game environment should not have any fixed classes');
        }
        showContents(getGameContents(initial, graphRef.current!, goBack));
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
      playGame ? initial : null,
      playGame ? getRandomRatedCourse(courses) : null,
      tool,
      setTool,
      (id: string | null) => {
        setHover(id);
        if (id) setShowRightSidebar(true);
      },
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
      victory,
      () => setVictory(true),
      setShowLeftSidebar,
      setShowRightSidebar,
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

    graphRef.current.syncCourses(fixedClasses.length === 0 ? [initial.id] : [], fixedClasses);
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

  useEffect(() => {
    if (victorySeen || !victory) return;
    const graph = graphRef.current!;

    setVictorySeen(true);

    showContents(getVictoryContents(goBack, setVictory, graph, router));
  }, [goBack, victorySeen, router, showContents, victory]);

  // update using graph methods
  // rerender whenever these dependencies change
  const context = useMemo(() => ({
    graph: graphRef.current,
    ref,
    tooltipRef,
    hoveredClassId,
    tool,
    explanation,
    setExplanation,
    ratingType,
    matchFilter,
    phase,
    subjects,
    showLeftSidebar,
    setShowLeftSidebar,
    showRightSidebar,
    setShowRightSidebar,
    elapsed,
    graphSchedule,
    victory,
  }), [hoveredClassId, tool, explanation, ratingType, matchFilter, phase, subjects, showLeftSidebar, showRightSidebar, elapsed, graphSchedule, victory]);

  return context;
}

function getVictoryContents(goBack: () => void, setVictory: (victory: boolean) => void, graph: Graph, router: NextRouter): ModalProps {
  return {
    close() {
      goBack();
      setVictory(false);
    },
    content: (
      <div className="flex flex-col space-y-4 p-6">
        <p>
          Success! You made your way from
          {' '}
          {graph.initial!.subject + graph.initial!.catalog}
          {' '}
          to
          {' '}
          {graph.target!.subject + graph.target!.catalog}
          {' '}
          in
          {' '}
          {(Date.now() - graph.startTime) / 1000}
          {' '}
          seconds, exploring
          {' '}
          {graph.maxCourses}
          {' '}
          courses along the way and using
          {' '}
          {graph.hintsUsed}
          {' '}
          hints.
        </p>

        <button
          type="button"
          className="button secondary mx-auto"
          onClick={() => router.reload()}
        >
          Play again
        </button>
      </div>
    ),
    title: 'You win!',
  };
}

function getGameContents(initial: CourseBrief, graph: Graph, goBack: () => void): ModalProps {
  return {
    title: 'Exploration Game',
    close: 'none', // force user to click "Begin" button
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
            {graph.target!.subject + graph.target!.catalog}
          </strong>
          .
        </p>
        <p>
          This has difficulty
          {' '}
          {graph.difficulty}
          /
          {Graph.DIFFICULTY_GRADE}
          .
        </p>
        <p>
          Good luck and have fun!
        </p>
        <button
          type="button"
          onClick={() => {
            goBack();
            graph.cleanupClickMe();
            graph.setPhase('ready');
          }}
          className="button secondary mx-auto"
        >
          Begin
        </button>
      </div>
    ),
  };
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
