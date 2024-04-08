import * as d3 from 'd3';
import { kdTree } from 'kd-tree-javascript';
import {
  createRef, useEffect, useMemo, useRef, useState,
} from 'react';
import { CourseBrief, useCourseEmbeddingData } from '../../components/ClassesCloudPage/useData';
import {
  ExtendedClass, getClassId, getSubjectColor, getUpcomingSemester,
} from '../../src/lib';
import Layout from '../../components/Layout/Layout';
import { Auth, ClassCache, Schedules } from '../../src/features';
import { AuthRequiredInstantSearchProvider } from '../../components/AuthRequiredInstantSearchProvider';
import { WithMeili } from '../../components/Layout/WithMeili';
import { ScheduleSyncer } from '../../components/ScheduleSyncer';
import { SearchStateProvider, getDefaultSearchStateForSemester } from '../../src/context/searchState';
import SearchBox from '../../components/SearchComponents/SearchBox/SearchBox';
import Hits from '../../components/SearchComponents/Hits';
import { InstantMeiliSearchInstance, useMeiliClient } from '../../src/context/meili';
import { useModal } from '../../src/context/modal';
import { useAppDispatch, useAppSelector } from '../../src/utils/hooks';
import { AppDispatch } from '../../src/store';
import { transformClassSize } from '../../components/Course/RatingIndicators';
import useChosenScheduleContext, { ChosenScheduleContext, ChosenScheduleContextType } from '../../src/context/selectedSchedule';
import { createLocal } from '../../src/features/schedules';

type Datum = CourseBrief & {
  pca: number[];
  x: number;
  y: number;
};


export default function GraphPage() {
  const userId = Auth.useAuthProperty('uid');

  const chosenScheduleContext = useMemo((): ChosenScheduleContextType => ({
    chooseSchedule: () => null,
    chosenScheduleId: 'GRAPH_SCHEDULE',
  }), []);

  return (
    <Layout title="Graph">
      <WithMeili userId={userId}>
        <ChosenScheduleContext.Provider value={chosenScheduleContext}>
          <div className="relative flex">
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
        <div className="relative inset-y-0 flex w-64 flex-col overflow-hidden">
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

function initGraph({
  svgDom, dispatch, client, showCourse, positions, courses,
}: {
  svgDom: SVGSVGElement;
  dispatch: AppDispatch;
  client: InstantMeiliSearchInstance;
  showCourse: (course: ExtendedClass) => void;
  positions: number[][];
  courses: CourseBrief[];
}) {
  const radius = 5;

  const svg = d3.select(svgDom);

  // these get initialized later in the component by the user
  const sim = d3
    .forceSimulation()
    .force('link', d3.forceLink().id((d) => d.id).strength(0.01))
    .force('charge', d3.forceManyBody().strength(-100))
    .force('x', d3.forceX())
    .force('y', d3.forceY());

  const link = svg.append('g')
    .attr('stroke', '#999')
    .attr('stroke-opacity', 0.6)
    .selectAll('line');

  const node = svg.append('g')
    .attr('stroke', '#fff')
    .attr('stroke-width', 1.5)
    .selectAll<SVGCircleElement, Datum>('circle');

  // drag nodes around
  const drag = d3.drag<any, Datum>()
    .on('start', (event) => {
      if (!event.active) sim.alphaTarget(0.3).restart();
      event.subject.fx = event.subject.x;
      event.subject.fy = event.subject.y;
    })
    .on('drag', (event) => {
      event.subject.fx = event.x;
      event.subject.fy = event.y;
    })
    .on('end', (event) => {
      if (!event.active) sim.alphaTarget(0);
      event.subject.fx = null;
      event.subject.fy = null;
    });

  // click on a node
  node.on('click', (event, d) => {
    dispatch(ClassCache.loadCourses(client, [getClassId(d.id)]))
      .then(([course]) => {
        showCourse(course);
      })
      .catch((err) => console.error(err));
  });

  // eslint-disable-next-line new-cap
  const tree = new kdTree(
    positions.map((pos, i) => [i, ...pos] as const),
    (a, b) => Math.hypot(...a.slice(1).map((x, i) => x - b[i + 1])),
    Array.from({ length: positions[0].length }, (_, i) => i + 1),
  );

  // update node positions
  sim.on('tick', () => {
    console.log('ticking', link.data().length, node.data().length);
    link
      .attr('x1', (d) => d.source.x)
      .attr('y1', (d) => d.source.y)
      .attr('x2', (d) => d.target.x)
      .attr('y2', (d) => d.target.y);

    node
      .attr('cx', (d) => d.x)
      .attr('cy', (d) => d.y);
  });

  return {
    node,
    sim,
    link,
    update(nodes: Datum[], links: { source: Datum; target: Datum }[]) {
      console.debug('updating graph', nodes.length, links.length);

      // copy existing nodes and links
      const existingNodes = new Map<string, Datum>(node.data().map((d) => [d.id, d] as const));
      nodes = nodes.map((n) => ({
        ...existingNodes.get(n.id),
        ...n,
      }));
      links = links.map((l) => ({ ...l }));

      link
        .data(links)
        .join(
          (enter) => enter.append('line')
            .attr('stroke-width', 2),
          (update) => update,
          (exit) => exit,
        );

      node
        .data(nodes, (d) => d.id)
        .join(
          (enter) => enter.append('circle')
            .attr('r', (d) => radius * transformClassSize(d.meanClassSize || 30))
            .attr('fill', (d) => getSubjectColor(d.subject, (d.meanRating || 3) / 5))
            .call(drag)
          // expand node on hover
            .on('mouseover', (event, d) => {
              d3.select(event.target)
                .transition()
                .duration(100)
                .attr('r', radius * 2);
            })
            .on('mouseout', (event, d) => {
              d3.select(event.target)
                .transition()
                .duration(100)
                .attr('r', radius);
            })
          // double click on a node adds neighbours to graph
            .on('dblclick', (event, d) => {
              const neighbours = tree.nearest([d.i, ...d.pca], 5);
              const newNodes: Datum[] = neighbours.map(([[i]]) => ({
                ...courses[i],
                pca: positions[i],
                x: d.x + Math.random() * 10 - 5,
                y: d.y + Math.random() * 10 - 5,
              }));
              const newLinks = newNodes.map((n) => ({ source: d, target: n }));

              this.update([...nodes, ...newNodes], [...links, ...newLinks]);
            })
            .call((n) => n.append('title')
              .text((d) => d.subject)),
          (update) => update,
          (exit) => exit, // don't remove nodes
        );

      sim.nodes(nodes);
      sim.force('link')!.links(links);
      sim.alpha(1).restart();
    },
  };
}

/**
 * A 2D d3 force graph of different courses.
 */
function Graph() {
  const { positions, courses } = useCourseEmbeddingData('all');
  const ref = useRef<SVGSVGElement>();
  const graphRef = useRef<ReturnType<typeof initGraph>>();

  const { chosenScheduleId } = useChosenScheduleContext();
  const chosenSchedule = useAppSelector(Schedules.selectSchedule(chosenScheduleId));

  const dispatch = useAppDispatch();
  const { client } = useMeiliClient();
  const { showCourse } = useModal();

  const width = 800;
  const height = 800;

  useEffect(() => {
    if (!ref.current || !client || !positions || !courses) return;

    if (!graphRef.current) {
      console.log('initializing graph');

      graphRef.current = initGraph({
        svgDom: ref.current,
        dispatch,
        client,
        showCourse,
        positions,
        courses,
      });

      dispatch(createLocal({
        id: 'GRAPH_SCHEDULE',
        title: 'Graph Schedule',
        createdAt: new Date().toISOString(),
        ownerUid: 'GRAPH_USER',
        public: false,
        classes: [],
        ...getUpcomingSemester(),
      }));

      graphRef.current.update(courses.slice(0, 10).map((c) => ({
        ...c,
        pca: positions[c.i],
        x: Math.random() * width - width / 2,
        y: Math.random() * height - height / 2,
      })), []);

      return () => {
        graphRef.current!.sim.stop();
      };
    }
  }, [positions, courses, client, dispatch, showCourse]);

  // useEffect(() => {
  //   if (!graphRef.current || !chosenSchedule || !courses || !positions) return;

  //   console.log(chosenSchedule.classes);

  //   const nodes: Datum[] = chosenSchedule.classes!.map((id) => {
  //     const courseBrief = courses.find((c) => c.id === id)!;
  //     return {
  //       ...courseBrief,
  //       pca: positions[courseBrief.i],
  //       x: Math.random() * width,
  //       y: Math.random() * height,
  //     };
  //   });

  //   graphRef.current.update(nodes, []);
  // }, [chosenSchedule, courses, positions]);

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
