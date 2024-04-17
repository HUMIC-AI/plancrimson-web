import { useEffect, useRef, useState } from 'react';
import { useCourseEmbeddingData } from '../ClassesCloudPage/useData';
import {
  Subject,
  choose, getUpcomingSemester,
} from '../../src/lib';
import {
  alertUnexpectedError, useAppDispatch, useAppSelector, useElapsed,
} from '../../src/utils/hooks';
import { Auth, Schedules } from '../../src/features';
import { useClasses } from '../../src/utils/schedules';
import { GRAPH_SCHEDULE } from '../../src/features/schedules';
import { useModal } from '../../src/context/modal';
import { GraphInstructions, RatingType } from './HoveredCourseInfo';
import { signInUser } from '../Layout/useSyncAuth';
import { InitGraphProps, Graph } from './Graph';

/**
 * Need to be careful with two way synchronization between redux store
 * GRAPH_SCHEDULE and the graph's internal nodes and links.
 */

export function useUpdateGraph({
  setHover, scheduleId,
}: InitGraphProps) {
  const { positions, courses } = useCourseEmbeddingData('all', undefined, 'pca');
  const { showContents, setOpen } = useModal();
  const userId = Auth.useAuthProperty('uid');
  const elapsed = useElapsed(1000, []);

  const dispatch = useAppDispatch();
  const graphSchedule = useAppSelector(Schedules.selectSchedule(GRAPH_SCHEDULE));
  const fixedClasses = useClasses(scheduleId);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [ratingType, setRatingType] = useState<RatingType>('meanRating');

  // refs for fine grained control
  const ref = useRef<SVGSVGElement>(null);
  const tooltipRef = useRef<HTMLParagraphElement>(null);
  const graphRef = useRef<Graph>();

  useEffect(() => {
    // only initialize graph after all data is included and 500ms has passed
    if (graphRef.current || !elapsed || !positions || !courses || !fixedClasses || !ref.current || !tooltipRef.current) return;

    console.info('initializing graph');

    const showInstructions = () => {
      const seen = userId && localStorage.getItem('graphInstructions');
      console.info('showing graph instructions', seen);
      if (seen) return graphRef.current!.setPhase('ready');
      const close = () => {
        setOpen(false);
        localStorage.setItem('graphInstructions', 'true');
        graphRef.current!.setPhase('ready');
      };
      showContents({
        title: 'Course Explorer',
        content: userId ? <GraphInstructions direction="row" /> : (
          <div className="flex items-center justify-center p-6">
            <button
              type="button"
              onClick={() => signInUser().then(close).catch(alertUnexpectedError)}
              className="button secondary"
            >
              Sign in to explore the graph!
            </button>
          </div>
        ),
        noExit: !userId,
        close,
      });
    };

    graphRef.current = new Graph(
      ref.current,
      tooltipRef.current,
      positions,
      courses,
      scheduleId,
      setHover,
      setSubjects,
      ratingType,
      setRatingType,
      showInstructions,
      (ids: string[]) => dispatch(Schedules.addCourses({ scheduleId: GRAPH_SCHEDULE, courseIds: ids })),
      (ids: string[]) => dispatch(Schedules.removeCourses({ scheduleId: GRAPH_SCHEDULE, courseIds: ids })),
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

    const initialNodes = fixedClasses.length === 0
      ? [choose(courses).id]
      : fixedClasses;

    graphRef.current.appendNodes(initialNodes.map((id) => graphRef.current!.toDatum(id)!).filter(Boolean), []);
  }, [courses, dispatch, elapsed, fixedClasses, positions, ratingType, scheduleId, setHover, setOpen, showContents, userId]);

  // whenever GRAPH_SCHEDULE is updated, update the graph nodes
  useEffect(() => {
    if (!graphRef.current || !graphSchedule?.classes || !fixedClasses || !courses || !positions) return;
    const nodes = [...graphSchedule.classes, ...fixedClasses].map((id) => graphRef.current!.toDatum(id)!).filter(Boolean);
    graphRef.current.appendNodes(nodes, []);
    graphRef.current.removeNodes(graphRef.current.getNodesNotIn(nodes).map((n) => n.id));
  }, [courses, fixedClasses, graphSchedule?.classes, positions]);

  // stop simulation when unmounting
  useEffect(() => () => {
    if (graphRef.current) {
      console.info('stopping graph');
      graphRef.current.sim.stop();
      dispatch(Schedules.deleteSchedule(GRAPH_SCHEDULE));
    }
  }, [dispatch]);

  return {
    graph: graphRef.current,
    ref,
    tooltipRef,
    subjects,
    elapsed,
  };
}
