import { useEffect, useRef, useState } from 'react';
import { useCourseEmbeddingData } from '../ClassesCloudPage/useData';
import {
  ExtendedClass,
  Subject, getUpcomingSemester,
} from '../../src/lib';
import {
  alertUnexpectedError, useAppDispatch, useAppSelector, useElapsed,
} from '../../src/utils/hooks';
import { Auth, ClassCache, Schedules } from '../../src/features';
import { useClasses } from '../../src/utils/schedules';
import { GRAPH_SCHEDULE } from '../../src/features/schedules';
import { useModal } from '../../src/context/modal';
import { signInUser } from '../Layout/useSyncAuth';
import { Graph, RatingField } from './Graph';
import { useMeiliClient } from '../../src/context/meili';
import { useGraphContext } from '../../src/context/GraphProvider';
import { getRandomRatedCourse } from '../../src/utils/utils';

/**
 * Need to be careful with two way synchronization between redux store
 * GRAPH_SCHEDULE and the graph's internal nodes and links.
 */

export function useUpdateGraph({
  scheduleId,
  hits,
  hasMore,
  refineNext,
}: {
  scheduleId: string | null;
  hits: ExtendedClass[];
  hasMore: boolean;
  refineNext: () => void;
}) {
  const {
    setHoveredClassId: setHover, setExplanation, explanation, setPhase, matchFilter, setMatchFilter,
  } = useGraphContext();
  const { positions, courses } = useCourseEmbeddingData('all', undefined, 'pca');
  const { showContents, setOpen } = useModal();
  const userId = Auth.useAuthProperty('uid');
  const elapsed = useElapsed(1000, []);

  const dispatch = useAppDispatch();
  const graphSchedule = useAppSelector(Schedules.selectSchedule(GRAPH_SCHEDULE));
  const fixedClasses = useClasses(scheduleId);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [ratingType, setRatingType] = useState<RatingField>('meanRating');

  // refs for fine grained control
  const { client } = useMeiliClient();
  const ref = useRef<SVGSVGElement>(null);
  const tooltipRef = useRef<HTMLParagraphElement>(null);
  const graphRef = useRef<Graph>();

  useEffect(() => {
    // only initialize graph after all data is included and 500ms has passed
    if (graphRef.current || !courses || !elapsed || !fixedClasses || !positions || !ref.current || !tooltipRef.current) return;

    console.info('initializing graph');

    // ask user to sign in if they haven't already
    const showInstructions = userId ? null : () => {
      console.info('showing graph instructions');
      showContents({
        title: 'Course Explorer',
        noExit: true,
        content: (
          <div className="flex items-center justify-center p-6">
            <button
              type="button"
              onClick={() => signInUser().then(() => {
                setOpen(false);
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

    graphRef.current.syncCourses(fixedClasses.length === 0 ? [getRandomRatedCourse(courses)] : [], fixedClasses);
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

  return {
    graph: graphRef.current,
    ref,
    tooltipRef,
    subjects,
    elapsed,
    graphSchedule,
  };
}
