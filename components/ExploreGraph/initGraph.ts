import * as d3 from 'd3';
import {
  useEffect, useRef,
} from 'react';
import { CourseBrief } from '../ClassesCloudPage/useData';
import {
  Subject,
  getSubjectColor, getUpcomingSemester,
} from '../../src/lib';
import { useMeiliClient } from '../../src/context/meili';
import { useModal } from '../../src/context/modal';
import { createLocal } from '../../src/features/schedules';
import { useAppDispatch } from '../../src/utils/hooks';

export type DatumBase = CourseBrief & {
  pca: number[];
};

export type Datum = DatumBase & {
  x: number;
  y: number;
};

export type LinkDatum = {
  source: Datum;
  target: Datum;
};

export type Simulation = d3.Simulation<Datum, LinkDatum>;

export type InitGraphProps = {
  positions: number[][] | null;
  courses: CourseBrief[] | null;
  onHover: (id: string | null) => void;
  onFix: (id: string | null) => void;
  setSubjects: (subjects: Subject[]) => void;
};

export type InitGraphPropsRequired = InitGraphProps & {
  positions: number[][];
  courses: CourseBrief[];
};

export type GraphState = ReturnType<typeof initGraph>;

const RADIUS = 4;
const T_DURATION = 150;
const LINK_STRENGTH = 0.1;
const CHARGE_STRENGTH = -100;

const getColor = (d: DatumBase) => getSubjectColor(d.subject, {
  saturation: (d.meanRating ? d.meanRating : 3) / 5,
  opacity: (d.meanHours ? d.meanHours : 3) / 5,
});
const getRadius = (d: CourseBrief) => RADIUS * (d.meanClassSize ? Math.sqrt(d.meanClassSize) : Math.sqrt(20));
const stringify = (d: string | { id: string }) => (typeof d === 'string' ? d : d.id);
const sameLink = (l: LinkDatum, d: LinkDatum) => {
  const lsrc = stringify(l.source);
  const ltrg = stringify(l.target);
  const dsrc = stringify(d.source);
  const dtrg = stringify(d.target);
  return (lsrc === dsrc && ltrg === dtrg) || (lsrc === dtrg && ltrg === dsrc);
};

export type GraphHook = {
  graph?: ReturnType<typeof initGraph>;
  ref: React.RefObject<SVGSVGElement>;
};

export function useUpdateGraph(props: InitGraphProps): GraphHook {
  const dispatch = useAppDispatch();
  const { client } = useMeiliClient();
  const { showCourse } = useModal();

  const ref = useRef<SVGSVGElement>(null);
  const graphRef = useRef<ReturnType<typeof initGraph>>();

  useEffect(() => {
    // only initialize graph once
    if (graphRef.current || !props.positions || !props.courses || !ref.current) return;

    console.info('initializing graph');

    graphRef.current = initGraph(ref.current, props as InitGraphPropsRequired);

    dispatch(createLocal({
      id: 'GRAPH_SCHEDULE',
      title: 'Graph Schedule',
      createdAt: new Date().toISOString(),
      ownerUid: 'GRAPH_USER',
      public: false,
      classes: [],
      ...getUpcomingSemester(),
    }));
  }, [dispatch, client, showCourse, props]);

  // stop simulation when unmounting
  useEffect(() => () => {
    if (graphRef.current) {
      console.info('stopping graph');
      graphRef.current.sim.stop();
    }
  }, []);

  return {
    graph: graphRef.current,
    ref,
  };
}

function initGraph(svgDom: SVGSVGElement, {
  positions, courses, onHover, onFix, setSubjects,
}: InitGraphPropsRequired) {
  const svg = d3.select(svgDom);

  // these get initialized later in the component by the user
  const sim = d3
    .forceSimulation()
    .force('link', d3.forceLink<Datum, LinkDatum>().id((d) => d.id).strength(LINK_STRENGTH))
    .force('charge', d3.forceManyBody().strength(CHARGE_STRENGTH))
    .force('collide', d3.forceCollide<Datum>((d) => getRadius(d) + RADIUS * 2).iterations(2))
    .force('x', d3.forceX())
    .force('y', d3.forceY());

  const linkGroup = svg.append('g')
    .attr('stroke', '#999')
    .attr('stroke-opacity', 0.6);

  let link = linkGroup.selectAll<SVGLineElement, LinkDatum>('line');

  const nodeGroup = svg.append('g')
    .attr('stroke', '#fff')
    .attr('stroke-width', 1.5)
    .attr('cursor', 'grab');

  let node = nodeGroup.selectAll<SVGCircleElement, Datum>('circle');

  let fixedId: string | null = null;
  let highlightedIds: string[] = [];

  function renderHighlights() {
    return node.transition()
      .duration(T_DURATION)
      .attr('stroke-opacity', (d) => {
        if (fixedId === d.id) return 4;
        if (highlightedIds.includes(d.id)) return 2;
        return 0;
      });
  }

  function highlight(subject: Subject | null) {
    console.debug('highlighting subject', subject);
    const ids = node.data().filter((d) => d.subject === subject).map((d) => d.id);
    highlightedIds = ids;
    renderHighlights();
  }

  const setFixedId = (id: string | null) => {
    console.debug('fixing node', id);
    id = fixedId === id ? null : id;
    onFix(id);
    fixedId = id;
    renderHighlights();
  };

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

  let flip = false;

  svg.on('contextmenu', (event) => {
    event.preventDefault();
    setFixedId(null);
  });

  function addNewNeighbours(d: Datum) {
    const nodes: Datum[] = positions.filter((_, i) => !node.data().some((g) => g.i === i))
      .map((pca, i) => ({ d: cos(d.pca, pca), i }))
      .sort((a, b) => (flip ? -1 : +1) * (b.d - a.d))
      .slice(0, 5)
      .map(({ i }) => ({
        ...courses[i],
        pca: positions[i],
        x: d.x + Math.random() * RADIUS * 4 - RADIUS * 2,
        y: d.y + Math.random() * RADIUS * 4 - RADIUS * 2,
      }));

    const links = nodes.map((t) => ({ source: d.id, target: t.id }));
    update(nodes, links);
  }

  function setFlip(f: boolean) {
    flip = f;
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
      .on('click', (event, d) => {
        addNewNeighbours(d);
      })
      .on('contextmenu', (event, d) => {
        event.preventDefault();
        event.stopPropagation();
        setFixedId(d.id);
      });
  }

  const width = svgDom.width.baseVal.value;
  const height = svgDom.height.baseVal.value;

  const zoom = d3.zoom<SVGSVGElement, unknown>()
    .extent([[0, 0], [width, height]])
    .scaleExtent([1, 8])
    .on('zoom', (event) => {
      linkGroup.attr('transform', event.transform);
      nodeGroup.attr('transform', event.transform);
    });

  svg.call(zoom);

  function resetZoom() {
    svg.transition()
      .duration(T_DURATION)
      .call(zoom.transform, d3.zoomIdentity);
  }

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

  function reset() {
    console.debug('resetting graph');
    fixedId = null;
    highlightedIds = [];
    remove(node.data().map((d) => d.id));
  }

  /**
   * Use {@link DatumBase} since we don't need to initialize x and y.
   */
  function update(nodes: DatumBase[], idLinks: { source: string; target: string; }[]) {
    console.debug('updating graph', nodes.length, idLinks.length);

    // copy existing nodes and links
    nodes = node.data().concat(
      nodes.filter((d) => !node.data().some((n) => n.id === d.id))
        .map((d) => ({ ...d }) as Datum),
    );

    const links = link.data().concat(
      idLinks.filter((d) => !link.data().some((l) => sameLink(l, d as unknown as LinkDatum)))
        .map((d) => ({ ...d }) as unknown as LinkDatum),
    );

    link = link
      .data(links, (d) => `${stringify(d.source)}:${stringify(d.target)}`)
      .join('line');

    node = node
      .data(nodes as Datum[], (d) => d.id)
      .join(
        (enter) => enter.append('circle')
          .attr('fill', getColor)
          .attr('stroke', 'black')
          .attr('stroke-width', 1.5)
          .attr('stroke-opacity', 0)
          .call(addListeners)
          .call((n) => n.transition()
            .duration(T_DURATION)
            .attr('r', getRadius))
          .call((n) => n.append('title')
            .text((d) => d.subject)),
      );

    restartSimulation();

    // set unique subjects
    setSubjects([...new Set(nodes.map((d) => d.subject))]);
  }

  return {
    sim,
    update,
    highlight,
    remove,
    reset,
    resetZoom,
    setFlip,
  };
}

const norm = (a: number[]) => Math.hypot(...a);
const dot = (a: number[], b: number[]) => a.reduce((acc, v, i) => acc + v * b[i], 0);
const cos = (a: number[], b: number[]) => dot(a, b) / (norm(a) * norm(b));
