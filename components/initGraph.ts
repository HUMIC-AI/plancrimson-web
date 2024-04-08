import * as d3 from 'd3';
import { kdTree } from 'kd-tree-javascript';
import {
  useEffect, useRef,
} from 'react';
import { CourseBrief } from './ClassesCloudPage/useData';
import {
  getSubjectColor, getUpcomingSemester,
} from '../src/lib';
import { useMeiliClient } from '../src/context/meili';
import { transformClassSize } from './Course/RatingIndicators';
import { useModal } from '../src/context/modal';
import { createLocal } from '../src/features/schedules';
import { useAppDispatch } from '../src/utils/hooks';

export type DatumBase = CourseBrief & {
  pca: number[];
};

export type Datum = DatumBase & {
  x: number;
  y: number;
};

export type LinkDatum = {
  source: string;
  target: string;
};

export type Simulation = d3.Simulation<Datum, LinkDatum>;

const RADIUS = 5;
const T_DURATION = 150;

const getColor = (d: DatumBase) => getSubjectColor(d.subject, {
  saturation: (d.meanHours || 3) / 5,
  opacity: (d.meanRating || 3) / 5,
});
const getRadius = (d: CourseBrief) => RADIUS * transformClassSize(d.meanClassSize || 30);
const stringify = (d: string | { id: string }) => (typeof d === 'string' ? d : d.id);
const sameLink = (l: LinkDatum, d: LinkDatum) => {
  const lsrc = stringify(l.source);
  const ltrg = stringify(l.target);
  const dsrc = stringify(d.source);
  const dtrg = stringify(d.target);
  return (lsrc === dsrc && ltrg === dtrg) || (lsrc === dtrg && ltrg === dsrc);
};

export function useUpdateGraph(
  positions: number[][] | null,
  courses: CourseBrief[] | null,
  onHover: (id: string | null) => void,
) {
  const dispatch = useAppDispatch();
  const { client } = useMeiliClient();
  const { showCourse } = useModal();

  const ref = useRef<SVGSVGElement>(null);
  const graphRef = useRef<ReturnType<typeof initGraph>>();

  useEffect(() => {
    // only initialize graph once
    if (graphRef.current || !positions || !courses || !ref.current) return;

    console.log('initializing graph');

    graphRef.current = initGraph(ref.current, {
      positions,
      courses,
      onHover,
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
  }, [positions, courses, dispatch, client, showCourse, onHover]);

  // stop simulation when unmounting
  useEffect(() => () => {
    if (graphRef.current) {
      console.log('stopping graph');
      graphRef.current.sim.stop();
    }
  }, []);

  return {
    update: graphRef.current?.update,
    remove: graphRef.current?.remove,
    ref,
  };
}

function initGraph(svgDom: SVGSVGElement, {
  positions, courses, onHover,
}: {
  positions: number[][],
  courses: CourseBrief[],
  onHover: (id: string | null) => void,
}) {
  const svg = d3.select(svgDom);

  // these get initialized later in the component by the user
  const sim = d3
    .forceSimulation()
    .force('link', d3.forceLink<Datum, LinkDatum>().id((d) => d.id).strength(0.01))
    .force('charge', d3.forceManyBody().strength(-100))
    .force('x', d3.forceX())
    .force('y', d3.forceY());

  let link = svg.append('g')
    .attr('stroke', '#999')
    .attr('stroke-opacity', 0.6)
    .selectAll<SVGLineElement, LinkDatum>('line');

  const nodeGroup = svg.append('g')
    .attr('stroke', '#fff')
    .attr('stroke-width', 1.5)
    .attr('cursor', 'grab');

  let node = nodeGroup.selectAll<SVGCircleElement, Datum>('circle');

  const ticked = () => {
    link
      .attr('x1', (d) => d.source.x)
      .attr('y1', (d) => d.source.y)
      .attr('x2', (d) => d.target.x)
      .attr('y2', (d) => d.target.y);

    node
      .attr('cx', (d) => d.x)
      .attr('cy', (d) => d.y);
  };

  // update node positions
  sim.on('tick', ticked);

  console.log('building kd tree');
  console.time('kd tree');
  const dimensions = Array.from({ length: positions[0].length }, (_, i) => i + 1);
  // eslint-disable-next-line new-cap
  const tree = new kdTree(
    // use first position as course index
    positions.map((pos, i) => [i, ...pos] as const),
    (a, b) => Math.hypot(...dimensions.map((i) => a[i] - b[i])),
    dimensions,
  );
  console.timeEnd('kd tree');

  function addNewNeighbours(d: Datum) {
    const nodes: Datum[] = [];
    const existing = node.data();
    for (let count = 5; nodes.length < 5; count += 5) {
      const neighbours = tree.nearest([d.i, ...d.pca], count);
      nodes.push(...neighbours
        .filter(([[i]]) => !nodes.some((g) => g.i === i) && !existing.some((g) => g.i === i))
        .map(([[i]]) => ({
          ...courses[i],
          pca: positions[i],
          x: d.x + Math.random() * RADIUS - RADIUS / 2,
          y: d.y + Math.random() * RADIUS - RADIUS / 2,
        })));
    }
    const links = nodes.map((t) => ({ source: d.id, target: t.id }));
    update(nodes, links);
  }

  function addListeners(n: d3.Selection<SVGCircleElement, Datum, SVGGElement, unknown>) {
    // drag nodes around
    const drag = d3.drag<SVGCircleElement, Datum>()
      .on('start', (event) => {
        if (!event.active) sim.alphaTarget(0.3).restart();
        event.subject.fx = event.subject.x;
        event.subject.fy = event.subject.y;
        nodeGroup.attr('cursor', 'grabbing');
      })
      .on('drag', (event) => {
        event.subject.fx = event.x;
        event.subject.fy = event.y;
      })
      .on('end', (event) => {
        if (!event.active) sim.alphaTarget(0);
        event.subject.fx = null;
        event.subject.fy = null;
        nodeGroup.attr('cursor', 'grab');
      });

    n
      .call(drag)
      // expand node on hover
      .on('mouseover', (event, d) => {
        d3.select<SVGCircleElement, Datum>(event.target)
          .transition()
          .duration(T_DURATION)
          .attr('r', (g) => getRadius(g) + RADIUS * 2);
        onHover(d.id);
      })
      .on('mouseout', (event) => {
        d3.select<SVGCircleElement, Datum>(event.target)
          .transition()
          .duration(T_DURATION)
          .attr('r', getRadius);
        onHover(null);
      })
      // right click on a node adds neighbours to graph
      .on('click', (event, d) => {
        event.preventDefault();
        addNewNeighbours(d);
      });
  }

  const width = svgDom.width.baseVal.value;
  const height = svgDom.height.baseVal.value;

  const zoom = d3.zoom<SVGSVGElement, unknown>()
    .extent([[0, 0], [width, height]])
    .scaleExtent([1, 8])
    .on('zoom', (event) => {
      svg.attr('transform', event.transform);
    });

  svg.call(zoom);

  function restartSimulation() {
    sim.nodes(node.data());
    sim.force<d3.ForceLink<Datum, LinkDatum>>('link')!.links(link.data());
    sim.alpha(1).restart();
  }

  function remove(ids: string[]) {
    console.debug('removing nodes', ids.length);

    const nodes = node.data().filter((d) => !ids.some((id) => id === d.id));
    node = node.data(nodes, (d) => d.id);
    node.exit()
      .transition()
      .duration(T_DURATION)
      .attr('r', 0)
      .remove();

    // remove links that are no longer connected
    const links = link.data().filter(({ source, target }) => !ids.some(
      (id) => id === stringify(source) || id === stringify(target),
    ));
    link = link.data(links);
    link.exit()
      .transition()
      .duration(T_DURATION)
      .attr('stroke-opacity', 0)
      .remove();

    restartSimulation();
  }

  /**
   * Use {@link DatumBase} since we don't need to initialize x and y.
   */
  function update(nodes: DatumBase[], links: LinkDatum[]) {
    console.debug('updating graph', nodes.length, links.length);

    // copy existing nodes and links
    nodes = node.data().concat(
      nodes.filter((d) => !node.data().some((n) => n.id === d.id))
        .map((d) => ({ ...d }) as Datum),
    );

    links = link.data().concat(
      links.filter((d) => !link.data().some((l) => sameLink(l, d)))
        .map((d) => ({ ...d })),
    );

    link = link
      .data(links, (d) => `${stringify(d.source)}:${stringify(d.target)}`)
      .join('line');

    node = node
      .data(nodes as Datum[], (d) => d.id)
      .join(
        (enter) => enter.append('circle')
          .attr('fill', getColor)
          .call(addListeners)
          .call((n) => n.transition()
            .duration(T_DURATION)
            .attr('r', getRadius))
          .call((n) => n.append('title')
            .text((d) => d.subject)),
      );

    restartSimulation();
  }

  return {
    node,
    sim,
    update,
    remove,
    link,
  };
}
