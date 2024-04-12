import * as d3 from 'd3';
import {
  useEffect, useRef,
} from 'react';
import { CourseBrief } from '../ClassesCloudPage/useData';
import {
  Subject,
  cos,
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

export type CourseGroup = d3.Selection<SVGGElement, Datum, SVGGElement, unknown>;

const RADIUS = 4;
const T_DURATION = 150;
const MAX_LINK_STRENGTH = 0.3;
const CHARGE_STRENGTH = -100;
const CENTER_STRENGTH = 1e-2;

const getLinkStrength = ({ source, target }: LinkDatum) => (MAX_LINK_STRENGTH * (cos(source.pca, target.pca) + 1)) / 2;

// a scale of five emojis from least to most happy
const EMOJI_SCALE = ['😢', '😐', '😊', '😁', '🤩'];

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
    .force('link', d3.forceLink<Datum, LinkDatum>().id((d) => d.id).strength(getLinkStrength))
    .force('charge', d3.forceManyBody().strength(CHARGE_STRENGTH))
    .force('collide', d3.forceCollide<Datum>((d) => getRadius(d) + RADIUS * 2).iterations(2))
    .force('x', d3.forceX().strength(CENTER_STRENGTH))
    .force('y', d3.forceY().strength(CENTER_STRENGTH));

  const linkGroup = svg.append('g')
    .attr('stroke', '#999')
    .attr('stroke-opacity', 0.6);

  let link = linkGroup.selectAll<SVGLineElement, LinkDatum>('line');

  const nodeGroup = svg.append('g')
    .attr('stroke', '#fff')
    .attr('stroke-width', 1.5)
    .attr('cursor', 'grab');

  let node = nodeGroup.selectAll<SVGGElement, Datum>('g.course');

  let fixedId: string | null = null;
  let highlightedIds: string[] = [];

  function renderHighlights() {
    return node
      .select('circle')
      .transition()
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
      .attr('transform', (d) => `translate(${d.x},${d.y})`);
  };

  // update node positions
  sim.on('tick', ticked);

  let flip = false;

  svg
    .on('click', (event) => {
      event.preventDefault();
      setFixedId(null);
    })
    .on('contextmenu', (event) => {
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

  function setRadius(g: SVGGElement, radius: number) {
    const group = d3.select<SVGGElement, Datum>(g);

    group.selectChild('circle')
      .transition()
      .duration(T_DURATION)
      .attr('r', radius);

    group.selectChild('text')
      .transition()
      .duration(T_DURATION)
      .attr('font-size', `${radius}px`);
  }

  function addListeners(n: CourseGroup) {
    // drag nodes around
    const drag = d3.drag<SVGGElement, Datum>()
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
      .on('mouseover', function (event, d) {
        setRadius(this, getRadius(d) + RADIUS * 2);
        onHover(d.id);
        if (pulsing) {
          // stop pulsing animation
          pulsing.on('end', null);
          pulsing = null;
        }
      })
      .on('mouseout', function (event, d) {
        setRadius(this, getRadius(d));
        onHover(null);
      })
      .on('click', (event, d) => {
        event.preventDefault();
        event.stopPropagation();
        addNewNeighbours(d);
        setFixedId(d.id);
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

  let pulsing: d3.Transition<SVGCircleElement, Datum, SVGGElement, unknown> | null = null;

  function resetZoom() {
    svg.transition()
      .duration(T_DURATION)
      .call(zoom.transform, d3.zoomIdentity);
  }

  /** Gets called whenever nodes are updated */
  function restartSimulation() {
    sim.nodes(node.data());
    sim.force<d3.ForceLink<Datum, LinkDatum>>('link')!.links(link.data());
    sim.alpha(1).restart();
    setSubjects([...new Set(node.data().map((d) => d.subject))]);

    if (node.size() === 1) {
      pulsing = pulse(node);
    }
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
    highlight(null);
    setFixedId(null);
    setSubjects([]);
    remove(node.data().map((d) => d.id));
  }

  /**
   * Main update function for entering nodes into the graph.
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
        (enter) => enter.append('g')
          .classed('course', true)
          // add circle to each group
          .call((n) => n.append('circle')
            .attr('fill', getColor)
            .attr('stroke', 'black')
            .attr('stroke-width', 1.5)
            .attr('stroke-opacity', 0)
            .attr('r', 0)
            .transition()
            .duration(T_DURATION)
            .attr('r', getRadius))
          // add event listeners to each group
          .call(addListeners)
          .call((n) => n
            // add emoji to each group to indicate mean rating
            .select(function (d) {
              if (typeof d.meanRating === 'number') return this;
              return null;
            })
            .append('text')
            .attr('text-anchor', 'middle')
            .attr('dominant-baseline', 'central')
            .attr('font-size', getRadius)
            .attr('fill', 'black')
            .style('pointer-events', 'none')
            // some rescaling since average rating is quite high
            .text((d) => EMOJI_SCALE[Math.floor((d.meanRating! ** 2) / 5 - 1e-6)])),
      );

    restartSimulation();
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

// Define the pulse animation function
function pulse(c: CourseGroup) {
  return c.selectChild<SVGCircleElement>('circle')
    .transition('pulse')
    .duration(1000) // Set duration of each pulse
    // Increase the radius of the circle
    .attr('r', (d) => getRadius(d) + RADIUS * 2)
    // Transition back to the original radius
    .transition()
    .duration(1000)
    .attr('r', getRadius)
    // Repeat the pulse animation indefinitely
    .on('end', () => pulse(c));
}
