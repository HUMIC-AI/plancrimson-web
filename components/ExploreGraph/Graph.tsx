import * as d3 from 'd3';
import { getAnalytics, logEvent } from 'firebase/analytics';
import { Dispatch, SetStateAction } from 'react';
import { CourseBrief } from '../ClassesCloudPage/useData';
import {
  ExtendedClass,
  Subject,
  cos,
  splitArray,
} from '../../src/lib';
import { alertUnexpectedError } from '../../src/utils/hooks';
import { GRAPH_SCHEDULE } from '../../src/features/schedules';
import { getSubjectColor } from '../../src/utils/styles';

export type DatumWithoutPosition = CourseBrief & {
  pca: number[];
  scheduleId: string;
  radius: number;
};

export type Datum = DatumWithoutPosition & {
  x: number;
  y: number;
};

export type LinkDatum = {
  source: Datum;
  target: Datum;
  mode: 'Add similar' | 'Add opposite';
};

export type StringLink = { source: string; target: string; };

export type NodeId = string | { id: string };

export type Simulation = d3.Simulation<Datum, LinkDatum>;

export type CourseGroupSelection = d3.Selection<SVGGElement, Datum, SVGGElement, unknown>;

export type Explanation = {
  courses: Datum[];
  text: string | null;
};

export type RatingField = 'meanRating' | 'meanHours';

// a scale of five emojis from least to most happy
export const EMOJI_SCALES: Record<RatingField, [string, string, string, string, string]> = {
  meanRating: ['🫣', '😬', '😊', '😍', '🤩'],
  // meanHours: ['😌', '😐', '😰', '😱', '💀'],
  meanHours: ['🥱', '😎', '🧐', '😰', '💀'],
};

const getColor = (d: DatumWithoutPosition) => getSubjectColor(d.subject);
const stringify = (d: NodeId) => (typeof d === 'string' ? d : d.id);
const sameLink = (l: LinkDatum | StringLink, d: LinkDatum | StringLink) => {
  const lsrc = stringify(l.source);
  const ltrg = stringify(l.target);
  const dsrc = stringify(d.source);
  const dtrg = stringify(d.target);
  return (lsrc === dsrc && ltrg === dtrg) || (lsrc === dtrg && ltrg === dsrc);
};

type CircleTransition = d3.Transition<SVGCircleElement, null, SVGGElement, unknown>;

type TextTransition = d3.Transition<SVGTextElement, null, SVGGElement, unknown>;

export type GraphTool = typeof Graph.TOOLS[number];

export type GraphPhase = 'init' | 'wait' | 'info' | 'ready';

/**
 * The entire d3 graph visualization.
 * appendNodes and removeNodes should be used to update the graph.
 * These will also call the `onAppendCourses` and `onRemoveCourses` callbacks.
 * These callbacks synchronize the nodes with the redux store (specifically
 * the schedule with id {@link GRAPH_SCHEDULE}).
 */
export class Graph {
  public sim: Simulation;

  public static readonly TOOLS = ['Add similar', 'Add opposite', 'Erase'] as const;

  private phaseInternal: GraphPhase = 'init';

  private svg: d3.Selection<SVGSVGElement, unknown, null, undefined>;

  private tooltip: d3.Selection<HTMLParagraphElement, unknown, null, undefined>;

  private zoom: d3.ZoomBehavior<SVGSVGElement, unknown>;

  private drag: d3.DragBehavior<SVGGElement, Datum, d3.SubjectPosition>;

  private focusedCourse: {
    id: string | null;
    reason: 'hover' | 'fix';
  } = { id: null, reason: 'hover' };

  private width: number;

  private height: number;

  private highlightedSubject: Subject | null = null;

  private explanationComparingIds: string[] = [];

  private grid: d3.Selection<SVGCircleElement, number, SVGGElement, unknown>;

  private nodeGroup: d3.Selection<SVGGElement, unknown, null, unknown>;

  private node: CourseGroupSelection;

  private linkGroup: d3.Selection<SVGGElement, unknown, null, unknown>;

  private link: d3.Selection<SVGLineElement, LinkDatum, SVGGElement, unknown>;

  private static readonly RADIUS = 5;

  private static readonly INFO_RADIUS = 80;

  private static readonly T_DURATION = 400;

  private static readonly MAX_LINK_STRENGTH = 0.3;

  private static readonly CHARGE_STRENGTH = -100;

  private static readonly NUM_NEIGHBOURS = 2;

  private static readonly HOVERED_LINK_WIDTH = 25;

  private static readonly CENTER_STRENGTH = 0.05;

  private static readonly PULSE_DURATION = 750;

  public static readonly DIFFICULTY_GRADE = 10;

  private waitingForExplanation = false;

  public startTime = 0;

  constructor(
    svgDom: SVGSVGElement,
    tooltipDom: HTMLParagraphElement,
    private loadCourses: (ids: string[]) => Promise<ExtendedClass[]>,
    public readonly positions: number[][],
    public readonly courses: CourseBrief[],
    public readonly fixedScheduleId: string | null,
    public readonly initial: CourseBrief | null,
    public readonly target: CourseBrief | null,
    public mode: GraphTool,
    private reactSetMode: Dispatch<SetStateAction<GraphTool>>,
    private reactSetHover: (id: string | null) => void,
    private reactSetSubjects: (subjects: Subject[]) => void,
    private reactSetExplanation: Dispatch<SetStateAction<Explanation | null>>,
    private ratingField: RatingField,
    private reactSetRatingField: (ratingField: RatingField) => void,
    private showInstructions: null | (() => void),
    private reactAppendCourses: (ids: string[], scheduleId: string) => void,
    private reactRemoveCourses: (ids: string[], scheduleId: string) => void,
    private reactSetPhase: Dispatch<SetStateAction<GraphPhase>>,
    private hits: ExtendedClass[],
    private matchFilter: boolean,
    private reactSetMatchFilter: Dispatch<SetStateAction<boolean>>,
    private hasMore: boolean,
    private refineNext: () => void,
    private victory: boolean,
    private handleVictory: () => void,
  ) {
    this.svg = d3.select(svgDom);
    this.tooltip = d3.select(tooltipDom);

    // these get initialized later in the component by the user
    this.sim = d3
      .forceSimulation<Datum>()
      .force('link', d3.forceLink<Datum, LinkDatum>().id((d) => d.id).strength(Graph.getLinkStrength))
      .force('charge', d3.forceManyBody().strength(Graph.CHARGE_STRENGTH))
      .force('collide', d3.forceCollide<Datum>((d) => (d.radius + Graph.collideRadius)))
      .force('x', d3.forceX().strength(Graph.CENTER_STRENGTH))
      .force('y', d3.forceY().strength(Graph.CENTER_STRENGTH))
      .force('center', d3.forceCenter());

    // background radius lines

    const r = d3.scaleLinear().domain([0, 1]).range([0, 500]);

    this.grid = this.svg.append('g')
      .selectAll('g')
      .data(r.ticks(5))
      .join('g')
      .append('circle')
      .attr('fill', 'none')
      .attr('stroke', 'rgb(var(--color-gray-primary) / 0.2)')
      .attr('stroke-dasharray', '8 16')
      .attr('r', r);

    this.linkGroup = this.svg.append('g')
      .attr('stroke-opacity', 0.3)
      .attr('stroke-linecap', 'round')
      .attr('cursor', 'help');

    this.link = this.linkGroup.selectAll<SVGLineElement, LinkDatum>('line');

    // set initial node properties here
    // properties get transitioned later
    this.nodeGroup = this.svg.append('g')
      .attr('text-anchor', 'middle')
      .attr('dominant-baseline', 'central')
      .attr('fill', 'rgb(var(--color-primary))')
      .attr('cursor', 'grab');

    this.node = this.nodeGroup.selectAll<SVGGElement, Datum>('g');

    // update node positions
    this.sim.on('tick', this.ticked.bind(this));

    this.svg
      .on('click contextmenu', (event) => {
        event.preventDefault();
        this.focusCourse(null, 'fix');
        if (!this.waitingForExplanation) {
          this.clearExplanation();
        }
      });

    this.width = svgDom.width.baseVal.value;
    this.height = svgDom.height.baseVal.value;

    this.zoom = d3.zoom<SVGSVGElement, unknown>()
      .extent([[0, 0], [this.width, this.height]])
      .scaleExtent([1, 4])
      .on('zoom', (event) => {
        this.linkGroup.attr('transform', event.transform);
        this.nodeGroup.attr('transform', event.transform);
        this.grid.attr('transform', event.transform);
      });

    this.drag = d3.drag<SVGGElement, Datum>()
      .on('start', (event) => {
        // nonzero alpha target to keep the simulation running while dragging
        if (!event.active) this.sim.alphaTarget(0.3).restart();
        event.subject.fx = event.subject.x;
        event.subject.fy = event.subject.y;
        this.nodeGroup.attr('cursor', 'grabbing');
      })
      .on('drag', (event) => {
        event.subject.fx = event.x;
        event.subject.fy = event.y;
        this.moveTooltip(event.sourceEvent.clientX, event.sourceEvent.clientY);
      })
      .on('end', (event) => {
        if (!event.active) this.sim.alphaTarget(0);
        event.subject.fx = null;
        event.subject.fy = null;
        this.resetCursor();
      });

    this.svg.call(this.zoom);

    // set initial zoom
    this.svg.call(this.zoom.transform, this.defaultZoom);
  }

  get phase() {
    return this.phaseInternal;
  }

  get defaultZoom() {
    return d3.zoomIdentity.translate(-this.width / 8, 0).scale(1.5);
  }

  get rating() {
    return this.ratingField;
  }

  public clearExplanation() {
    this.waitingForExplanation = false;
    const shouldCloseExplanation = this.isExplanationOpen;
    this.explanationComparingIds = [];
    if (shouldCloseExplanation) this.reactSetExplanation(null);
    this.renderHighlights();
  }

  public setHits(hits: ExtendedClass[]) {
    this.hits = hits;
  }

  public setMatchFilter(checked: boolean) {
    this.matchFilter = checked;
    this.reactSetMatchFilter(checked);
  }

  private addCircle(enter: CourseGroupSelection) {
    const graph = this;

    enter.append('circle')
      .attr('fill', getColor)
      .attr('r', 0)
      .attr('stroke-opacity', 0);

    // add emoji to each group to indicate mean rating
    enter.filter((d) => typeof d.meanRating === 'number')
      .append('text')
      .classed('emoji', true)
      .style('pointer-events', 'none')
      .attr('font-size', 0)
      .text(this.getEmoji.bind(this));

    enter.each(function (d) {
      graph.transitionRadius(this, Graph.getRadius(d));
    });
  }

  private ticked() {
    this.link
      .attr('x1', (d) => d.source.x)
      .attr('y1', (d) => d.source.y)
      .attr('x2', (d) => d.target.x)
      .attr('y2', (d) => d.target.y);

    this.node
      .attr('transform', (d) => `translate(${d.x},${d.y})`);
  }

  get initialPca() {
    if (!this.initial) throw new Error('Must be playing game');
    return this.positions[this.initial.i];
  }

  get targetPca() {
    if (!this.target) throw new Error('Must be playing game');
    return this.positions[this.target.i];
  }

  get difficulty() {
    const c = cos(this.initialPca, this.targetPca);
    const p = 1 - Math.abs(c); // closer to zero is harder
    return Math.round(p * Graph.DIFFICULTY_GRADE);
  }

  // find the course with the closest cosine similarity to the target and hover it
  public focusHint() {
    let closest = -Infinity;
    let datum: Datum = null!;
    this.currentData.forEach((d) => {
      const c = cos(d.pca, this.targetPca);
      if (c > closest) {
        datum = d;
        closest = c;
      }
    });
    if (this.focusedCourse.id !== datum.id) {
      this.focusCourse(datum.id, 'hover');
    }
    this.zoomTo(datum);
  }

  public setMode(mode: Graph['mode']) {
    this.mode = mode;
    this.resetCursor();
    if (this.mode === 'Erase') {
      // disable zooming while erasing
      this.node.on('.drag', null);
      this.svg.on('.zoom', null);
    } else {
      this.node.call(this.drag);
      this.svg.call(this.zoom);
    }
    this.reactSetMode(mode);
  }

  private resetCursor() {
    if (this.mode === 'Erase') {
      this.svg.attr('cursor', 'crosshair');
      this.nodeGroup.attr('cursor', 'crosshair');
      this.linkGroup.attr('cursor', 'crosshair');
    } else {
      this.svg.attr('cursor', null);
      this.nodeGroup.attr('cursor', 'grab');
      this.linkGroup.attr('cursor', 'help');
    }
  }

  public resetZoom() {
    this.svg.transition('svg-zoom')
      .duration(Graph.PULSE_DURATION)
      .call(this.zoom.transform, this.defaultZoom);
  }

  public setRatingType(ratingType: RatingField) {
    this.ratingField = ratingType;
    this.reactSetRatingField(ratingType);
    this.node.select('text.emoji').text(this.getEmoji.bind(this));
  }

  public focusCourse(id: string | null, reason: 'hover' | 'fix') {
    console.debug('fixing node', id, reason);

    if (reason === 'hover') {
      this.reactSetHover(id);
      this.focusedCourse = { id, reason: 'hover' };
      this.renderHighlights();
      return;
    }

    // deselect a currently selected node
    id = this.focusedCourse.id === id && this.focusedCourse.reason === 'fix' ? null : id;

    if (id) this.reactSetHover(id);
    else if (this.focusedCourse) this.reactSetHover(null);

    this.focusedCourse = { id, reason: 'fix' };

    // replace a link explanation
    if (!this.waitingForExplanation && this.isExplanationOpen) {
      this.clearExplanation();
    }

    // zoom into the focused course
    const fixedNode = this.findData(this.focusedCourse.id);
    if (fixedNode) {
      this.zoomTo(fixedNode);
    }

    this.renderHighlights();
  }

  private zoomTo({ x, y }: { x: number, y: number }) {
    this.svg.transition('svg-zoom')
      .duration(Graph.PULSE_DURATION)
      .call(this.zoom.transform, this.defaultZoom.translate(-x, -y));
  }

  private static getNewPosition(d: Datum, course: CourseBrief) {
    const theta = Math.random() * 2 * Math.PI;
    const r = Graph.getRadius(course) + Graph.getRadius(d) + Math.random() * Graph.RADIUS;
    return {
      x: d.x + r * Math.cos(theta),
      y: d.y + r * Math.sin(theta),
    };
  }

  public findTitle(d: Pick<CourseBrief, 'catalog' | 'subject'>) {
    return this.currentData.find((n) => matchName(n, d));
  }

  public idInGraph(id: string) {
    return this.currentData.some((n) => n.id === id);
  }

  // get from all courses the ones whose titles are not in the graph
  get availableCourses() {
    return this.courses.filter((d) => !this.findTitle(d));
  }

  get isMatchFilter() {
    return this.matchFilter;
  }

  public setHasMore(hasMore: boolean) {
    this.hasMore = hasMore;
  }

  public setRefineNext(refineNext: () => void) {
    this.refineNext = refineNext;
  }

  private getNeighbours(d: Datum, numNeighbours: number): CourseBrief[] {
    // if filter enabled, take from the search hits
    const courses = this.matchFilter
      ? this.hits.map((h) => this.availableCourses.find((c) => c.id === h.id)!).filter(Boolean)
      : this.availableCourses;

    if (courses.length === 0 && this.matchFilter && !this.hasMore) {
      alert('No more courses to show. Try relaxing the filter.');
      return [];
    }

    // if we don't have enough neighbours, preemptively refine the search
    if (courses.length < 2 * numNeighbours && this.matchFilter && this.hasMore) {
      this.refineNext();
    }

    const sorted: (CourseBrief & { distance: number })[] = courses
      .map((course) => ({
        ...course,
        distance: cos(d.pca, this.positions[course.i]),
      }))
      .sort((a, b) => (this.mode === 'Add similar' ? -1 : +1) * (b.distance - a.distance));

    // remove duplicates
    const names = new Set();
    const neighbours: CourseBrief[] = [];
    while (names.size < numNeighbours && sorted.length > 0) {
      const { distance, ...n } = sorted.pop()!;
      if (!names.has(n.subject + n.catalog)) {
        names.add(n.subject + n.catalog);
        neighbours.push(n);
      }
    }
    return neighbours;
  }

  private addNewNeighbours(d: Datum, numNeighbours = Graph.NUM_NEIGHBOURS, positions?: { x: number; y: number }[]) {
    console.debug('adding neighbours', d.id);
    const neighbours = this.getNeighbours(d, numNeighbours);
    const nodes: Datum[] = neighbours.map((course, i) => ({
      ...course,
      pca: this.positions[course.i],
      // assume all fixed nodes are in the graph already
      scheduleId: GRAPH_SCHEDULE,
      radius: Graph.getRadius(course),
      ...(positions ? positions[i] : Graph.getNewPosition(d, course)),
    }));

    const links = nodes.map((t) => ({ source: d.id, target: t.id }));

    return this.appendNodes(nodes, links);
  }

  private renderHighlights() {
    return this.node
      .select('circle')
      .transition('highlight-t')
      .duration(Graph.T_DURATION)
      .attr('stroke-width', this.getStrokeWidth.bind(this))
      .attr('stroke', this.getStrokeColor.bind(this))
      .attr('stroke-opacity', (d) => (this.getStrokeWidth(d) > 0 ? 1 : 0));
  }

  private getStrokeColor(d: Datum) {
    if (this.focusedCourse.id !== d.id) return 'rgb(var(--color-gray-primary)';
    if (this.focusedCourse.reason === 'fix') return 'rgb(var(--color-blue-primary)';
    return 'rgb(var(--color-primary))';
  }

  private getStrokeWidth(d: Datum) {
    if (this.focusedCourse.id === d.id) return 6;
    if (this.explanationComparingIds.includes(d.id)) return 5;
    if (this.highlightedSubject === d.subject) return 3;
    if (d.scheduleId === this.fixedScheduleId) return 2;
    return 0;
  }

  /**
   * Transition the radius of nodes in the selection
   */
  private transitionRadius(g: SVGGElement, radius: number, { duration = Graph.T_DURATION, emojiOnly = false, updateForce = false } = {}): readonly [CircleTransition, TextTransition] {
    const group = d3.select<SVGGElement, Datum>(g);

    const circleTransition = group.selectChildren<SVGCircleElement, null>('circle')
      .transition('radius-t')
      .duration(duration)
      .attr('r', radius);

    const textTransition = group.selectChildren<SVGTextElement, null>(emojiOnly ? 'text.emoji' : 'text')
      .transition('radius-t')
      .duration(duration)
      .attr('font-size', `${radius}px`);

    // refresh the radius data
    if (updateForce) {
      group.datum().radius = radius;
      this.sim.nodes(this.currentData);
    }

    return [circleTransition, textTransition] as const;
  }

  /** Gets called whenever nodes are updated */
  private updateNodesInternal() {
    // tell simulation about new nodes and links
    this.sim.nodes(this.currentData);
    this.sim.force<d3.ForceLink<Datum, LinkDatum>>('link')!.links(this.link.data());
    this.sim.alpha(1).restart();

    // update link properties after strings are populated
    this.link
      .attr('stroke-width', Graph.getLinkWidth)
      // .attr('stroke-opacity', Graph.getLinkOpacity)
      .attr('stroke', Graph.getLinkColor);

    // callbacks
    this.reactSetSubjects([...new Set(this.currentData.map((d) => d.subject))]);

    if (!this.currentData.some((d) => d.id === this.focusedCourse.id)) {
      this.focusCourse(null, 'fix');
    }

    if (this.phaseInternal === 'init') {
      this.setPhase('wait');
    }
  }

  private static getLinkWidth(d: LinkDatum) {
    return Graph.collideRadius * (0.25 + 0.75 * Graph.getLinkOpacity(d));
  }

  private pulse(c: SVGGElement, radius: number, grow = true) {
    const [circleTransition] = this.transitionRadius(c, radius + (grow ? Graph.RADIUS : 0), { duration: Graph.PULSE_DURATION });
    circleTransition.on('end', () => this.pulse(c, radius, !grow));
  }

  get currentData() {
    return this.node.data();
  }

  /**
   * Main update function for entering nodes into the graph.
   * Ignores nodes that are already in the graph.
   * Use {@link DatumWithoutPosition} since we don't need to initialize x and y.
   * @returns The nodes and links that were actually added to the graph.
   */
  public appendNodes(nodesToAdd: DatumWithoutPosition[], idLinks: StringLink[]): readonly [Datum[], LinkDatum[]] {
    nodesToAdd = this.getNewNodes(nodesToAdd);
    idLinks = this.getNewLinks(idLinks);

    if (nodesToAdd.length === 0 && idLinks.length === 0) return [[], []];

    console.debug('appending nodes', nodesToAdd.length, idLinks.length);

    const nodeObjects = nodesToAdd.map((d) => ({ ...d }) as Datum);
    const linkObjects = idLinks.map((d) => ({ ...d }) as unknown as LinkDatum);

    this.link = this.link
      .data(this.link.data().concat(linkObjects), (d) => `${stringify(d.source)}:${stringify(d.target)}`)
      .join((enter) => enter.append('line')
        .attr('stroke', Graph.getLinkColor)
        .call(this.addLinkEventListeners.bind(this)));

    this.node = this.node
      .data(this.currentData.concat(nodeObjects), (d) => d.id)
      .join((enter) => enter.append('g')
        .call(this.addCircle.bind(this))
        .call(this.addNodeEventListeners.bind(this)));

    // callback
    const [fixed, regular] = splitArray(nodesToAdd, (d) => d.scheduleId === this.fixedScheduleId);
    if (regular.length > 0) {
      console.debug('appending regular courses', regular.length);
      this.reactAppendCourses(regular.map((d) => d.id), GRAPH_SCHEDULE);
    }
    if (fixed.length > 0) {
      console.debug('appending fixed courses', this.fixedScheduleId, fixed.length);
      this.reactAppendCourses(fixed.map((d) => d.id), this.fixedScheduleId!);
    }

    this.updateNodesInternal();

    if (this.target && !this.victory) {
      const found = this.node.filter((d) => matchName(d, this.target!));
      if (found.size() > 0) {
        this.transitionRadius(found.node()!, Graph.INFO_RADIUS);
        this.victory = true;
        this.handleVictory();
      }
    }

    return [nodeObjects, linkObjects];
  }

  private static getLinkColor(d: LinkDatum) {
    return d.mode === 'Add opposite'
      ? 'rgb(var(--color-blue-primary))'
      : 'rgb(var(--color-gray-primary))';
  }

  public getNewNodes<T extends NodeId>(nodes: T[]) {
    return nodes.filter((d) => !this.currentData.some((n) => n.id === stringify(d)));
  }

  /** Return current nodes that are not present in the provided list */
  public getNodesNotIn<T extends NodeId>(nodes: T[]) {
    return this.currentData.filter((d) => !nodes.some((n) => stringify(n) === d.id));
  }

  private getNewLinks(links: StringLink[]) {
    return links.filter((d) => !this.link.data().some((l) => sameLink(l, d)))
      .map((d) => ({ ...d, mode: this.mode }));
  }

  public linksTouchingNodes<T extends NodeId>(nodeIds: T[]) {
    return this.link.data().filter(({ source, target }) => nodeIds.some(
      (id) => id === stringify(source) || id === stringify(target),
    ));
  }

  private moveTooltip(x: number, y: number) {
    this.tooltip
      .style('left', `${x}px`)
      .style('top', `${y}px`);
  }

  private hideTooltip() {
    this.tooltip.classed('hidden', true);
  }

  get canReplaceHover() {
    return this.focusedCourse.id === null || this.focusedCourse.reason === 'hover';
  }

  /**
   * Add event listeners to each node
   */
  private addNodeEventListeners(n: CourseGroupSelection) {
    const graph = this;

    n
      .call(this.drag)
      // expand node on hover
      .on('mouseover.basic', function (event: MouseEvent, d) {
        // if we're waiting for user to interact and they do,
        // remove the "click me" label and reset radii
        if (graph.phaseInternal === 'wait') {
          return graph.setPhase('info', d.id);
        }

        // don't react if info demonstration is open or we are comparing courses
        if (graph.phaseInternal === 'info') return;

        console.debug('mousing over');

        if (graph.mode === 'Erase' && event.buttons === 1) {
          // if mouse is down, remove the node
          graph.eraseNode(d);
          return;
        }

        graph.transitionRadius(this, Graph.getRadius(d) + Graph.collideRadius);

        // set focused course
        if (graph.canReplaceHover) {
          graph.focusCourse(d.id, 'hover');
        }
        graph.showTooltipAt(d.subject + d.catalog, event.clientX, event.clientY);
      })
      .on('mousedown.basic', (event, d) => {
        if (graph.mode === 'Erase') {
          graph.eraseNode(d);
        }
      })
      .on('mousemove.basic', (event) => {
        graph.moveTooltip(event.clientX, event.clientY);
      })
      .on('mouseout.basic', function (event, d) {
        graph.transitionRadius(this, Graph.getRadius(d));
        graph.hideTooltip();
      })
      .on('click.basic', (event, d) => {
        event.preventDefault();
        event.stopPropagation();
        if (this.mode === 'Erase') {
          graph.eraseNode(d);
        } else {
          logEvent(getAnalytics(), 'explore_neighbours', {
            course: d,
          });
          graph.addNewNeighbours(d);
        }
      })
      .on('contextmenu.basic', (event, d) => {
        event.preventDefault();
        event.stopPropagation();
        graph.focusCourse(d.id, 'fix');
      });
  }

  private eraseNode(d: Datum) {
    if (d.scheduleId === GRAPH_SCHEDULE || confirm("Are you sure you want to remove this course? It's part of your schedule.")) {
      this.removeNodes([d.id]);
    }
  }

  private showTooltipAt(text: string, x: number, y: number) {
    this.tooltip
      .classed('hidden', false)
      .text(text);
    this.moveTooltip(x, y);
  }

  private addLinkEventListeners(l: d3.Selection<SVGLineElement, LinkDatum, SVGGElement, unknown>) {
    const graph = this;
    l
      .on('mouseover.basic', function (event, d) {
        const percent = Math.round(Graph.getLinkOpacity(d) * 100);
        graph.showTooltipAt(`${percent}%`, event.clientX, event.clientY);
        const link = d3.select<SVGLineElement, LinkDatum>(this);
        link
          .transition('link-t')
          .duration(Graph.T_DURATION)
          .attr('stroke-width', Graph.HOVERED_LINK_WIDTH);

        // move the nodes a bit apart
        // link.datum().source.radius += Graph.collideRadius;
        // link.datum().target.radius += Graph.collideRadius;
        // graph.sim.nodes(graph.currentData);
      })
      .on('mousedown.basic', (event, d) => {
        if (this.mode === 'Erase') {
          this.removeLinks([d]);
        }
      })
      .on('mousemove.basic', (event) => {
        graph.moveTooltip(event.clientX, event.clientY);
      })
      .on('mouseout.basic', function () {
        graph.hideTooltip();
        const link = d3.select<SVGLineElement, LinkDatum>(this);
        link
          .transition('link-t')
          .duration(Graph.T_DURATION)
          .attr('stroke-width', Graph.getLinkWidth);

        // reset the nodes
        // link.datum().source.radius -= Graph.collideRadius;
        // link.datum().target.radius -= Graph.collideRadius;
        // graph.sim.nodes(graph.currentData);
      })
      .on('click.basic', (event, d) => {
        event.stopPropagation();
        if (this.mode === 'Erase') {
          this.removeLinks([d]);
          return;
        }
        if (this.waitingForExplanation) return;
        this.waitingForExplanation = true;
        const courses = [{ ...d.source }, { ...d.target }];
        this.reactSetExplanation({ courses, text: null });
        this.explanationComparingIds = [d.source.id, d.target.id];
        this.focusCourse(null, 'fix');
        this.renderHighlights();
        this.askRelationship(d)
          .then((text) => {
            this.reactSetExplanation({ courses, text });
            this.waitingForExplanation = false;
          })
          .catch(alertUnexpectedError);
      });
  }

  get isExplanationOpen() {
    return this.explanationComparingIds.length > 0;
  }

  private async askRelationship({ source: { id: srcId }, target: { id: tgtId } }: LinkDatum): Promise<string> {
    const [src, tgt] = await this.loadCourses([srcId, tgtId]);

    // post to backend route to ask for relationship
    const response = await fetch('/api/relationship', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ src, tgt }),
    });

    const data = await response.json();

    return data.message;
  }

  public highlightSubject(subject: Subject | null) {
    console.debug('highlighting subject', this, subject);
    this.highlightedSubject = subject;
    this.renderHighlights();
  }

  private findData(id: string | null) {
    return this.currentData.find((d) => d.id === id);
  }

  private removeLinks(linksToRemove: LinkDatum[]) {
    this.link = this.link.data(this.link.data().filter((l) => !linksToRemove.some((d) => sameLink(l, d))));
    this.link.exit()
      .on('.basic', null)
      .transition('link-t')
      .duration(Graph.T_DURATION)
      .attr('stroke-opacity', 0)
      .remove();

    this.hideTooltip();
    this.updateNodesInternal();
  }

  public removeNodes(idsToRemove: string[]) {
    idsToRemove = idsToRemove.filter((id) => this.idInGraph(id));

    if (idsToRemove.length === 0) return;

    console.debug('removing nodes', idsToRemove.length);

    // remove fixed and regular classes separately
    const [fixed, regular] = splitArray(idsToRemove.map((id) => this.findData(id)!), (d) => d.scheduleId === this.fixedScheduleId);

    const graph = this;

    const nodes = this.getNodesNotIn(idsToRemove);
    this.node = this.node.data(nodes, (d) => d.id);
    this.node.exit()
      // remove all listeners
      .on('.basic .drag', null)
      .each(function () {
        const [t] = graph.transitionRadius(this, 0);
        t.on('end.remove', () => d3.select(this).remove());
      });

    // remove links that are no longer connected
    const links = this.linksTouchingNodes(idsToRemove);
    this.removeLinks(links);

    if (regular.length > 0) {
      console.debug('removing regular courses', regular.length);
      this.reactRemoveCourses(regular.map((d) => d.id), GRAPH_SCHEDULE);
    }
    if (fixed.length > 0) {
      console.debug('removing fixed courses', fixed.length);
      this.reactRemoveCourses(fixed.map((d) => d.id), this.fixedScheduleId!);
    }
  }

  private getEmoji(d: Datum) {
    const v = this.ratingField === 'meanHours'
      ? 5 * (d.meanHours! / 20)
      : 5 * ((d.meanRating! ** 2) / 25);
    return EMOJI_SCALES[this.ratingField][Math.max(0, Math.min(4, Math.floor(v)))];
  }

  private static getLinkStrength(link: LinkDatum) {
    return Graph.MAX_LINK_STRENGTH * Graph.getLinkOpacity(link);
  }

  public static getRadius(d: CourseBrief) {
    return Graph.RADIUS * (d.meanClassSize ? Math.sqrt(d.meanClassSize) : Math.sqrt(20));
  }

  public toDatum(id: string, scheduleId: string): DatumWithoutPosition | null {
    const course = this.courses.find((c) => c.id === id);
    if (!course) return null;
    return {
      ...course, radius: Graph.getRadius(course), pca: this.positions[course.i], scheduleId,
    };
  }

  public syncCourses(ids: string[], fixed: string[]) {
    // remove possible duplicates
    ids = ids.filter((id) => !fixed.includes(id));
    console.debug('syncing courses', ids.length, 'regular', fixed.length, 'fixed');
    const nodes = [...ids, ...fixed].map((id) => this.toDatum(id, fixed.includes(id) ? this.fixedScheduleId! : GRAPH_SCHEDULE)!).filter(Boolean);
    this.appendNodes(nodes, []);
    const toRemove = this.getNodesNotIn(nodes).map((n) => n.id);
    this.removeNodes(toRemove);
  }

  public cleanupClickMe() {
    this.node.selectAll('circle, text').interrupt('radius-t');

    // fade out click me text
    this.node.selectChildren('text.click-me')
      .transition('radius-t')
      .duration(Graph.T_DURATION)
      .attr('opacity', 0)
      .remove();
  }

  public setPhase(newPhase: Graph['phaseInternal'], id?: string) {
    if (newPhase === 'init') {
      this.reactSetHover(null);
      this.resetZoom();
    } else if (newPhase === 'wait') {
      // add a "click me" label
      console.debug('adding click me');
      this.node.selectChildren('text.click-me').remove();
      this.node.append('text')
        .classed('click-me', true)
        .attr('pointer-events', 'none')
        .attr('font-size', 0)
        .attr('font-weight', 300)
        .attr('opacity', 1)
        .text('Hover me!');

      const pulse = this.pulse.bind(this);

      this.node.each(function (d) {
        pulse(this, Graph.getRadius(d), true);
      });
    } else if (newPhase === 'info') {
      // triggered when user hovers over a "click me" node
      this.cleanupClickMe();

      const graph = this;

      this.node.each(function (d) {
        if (d.id === id) return;
        graph.transitionRadius(this, Graph.getRadius(d), { duration: Graph.T_DURATION, emojiOnly: true });
      });

      if (this.showInstructions) this.showInstructions();
      else this.addInfoLabel(this.node.filter((d) => d.id === id));
    }

    this.phaseInternal = newPhase;
    this.reactSetPhase(newPhase);
  }

  private addInfoLabel(trigger: CourseGroupSelection) {
    const n = { ...trigger.datum() };

    const [t] = this.transitionRadius(trigger.node()!, Graph.INFO_RADIUS, { duration: Graph.PULSE_DURATION, emojiOnly: true, updateForce: true });

    // disable listeners temporarily
    this.node.on('.basic .drag', null);

    t.on('end.info', () => {
      const [, [link]] = this.addNewNeighbours(n, 2, [{ x: -5, y: 0 }, { x: 0, y: 5 }]);

      // pause simulation while info label is open
      this.sim.tick(10).stop();
      this.ticked();
      // zoom so that new position of trigger gets mapped to old position
      const { x, y } = trigger.datum();
      this.svg.call(this.zoom.translateBy, -x + n.x, -y + n.y);

      const infoLabels = this.addInfoLabels(x, y, Graph.INFO_RADIUS, link);

      // add listeners to remove group on mouseout
      trigger.on('mouseout.info click.info', (e) => {
        console.debug('removing info label', e);
        infoLabels.remove();
        this.sim.alpha(1).restart();
        const [transition] = this.transitionRadius(trigger.node()!, Graph.getRadius(n), { emojiOnly: true, updateForce: true });
        transition.on('end.info', () => {
          // wait to avoid double click trigger
          this.focusCourse(n.id, 'hover');
          this.node.call(this.addNodeEventListeners.bind(this));
        });
        this.setPhase('ready');

        // only run this listener once
        trigger.on('.info', null);
      });
    });
  }

  private addInfoLabels(x: number, y: number, r: number, link: LinkDatum) {
    // add info labels to the node
    const group = this.nodeGroup.append('g')
      .attr('pointer-events', 'none')
      .attr('transform', `translate(${x}, ${y})`)
      .attr('fill', 'rgb(var(--color-primary))')
      .attr('font-size', r / 8);

    group
      .append('text')
      .attr('x', r / 2)
      .attr('y', 0)
      .attr('text-anchor', 'start')
      .text('Emoji = QReport rating');

    group
      .append('line')
      .attr('x1', 0)
      .attr('y1', -6)
      .attr('x2', 0)
      .attr('y2', 6);

    group
      .append('line')
      .attr('x1', r)
      .attr('y1', -6)
      .attr('x2', r)
      .attr('y2', 6);

    group
      .append('line')
      .attr('x1', 0)
      .attr('y1', 0)
      .attr('x2', r)
      .attr('y2', 0);

    group
      .append('text')
      .attr('x', 0)
      .attr('y', r / 2)
      .attr('dy', r / 12)
      .text('Radius = Number of students');

    group
      .append('text')
      .attr('x', 0)
      .attr('y', -r / 2)
      .attr('dy', -r / 12)
      .text('Color = Subject');

    group.append('text')
      .attr('x', link.target.x * 0.8 - x * 0.8)
      .attr('y', link.target.y * 0.8 - y * 0.8)
      .text('Click link to explain');

    group
      .append('text')
      .attr('x', 0)
      .attr('y', (link.target.y > y ? -1 : +1) * (r + r / 4))
      .attr('font-size', 20)
      .text('Click to explore');

    return group;
  }

  private static getLinkOpacity({ source, target }: LinkDatum) {
    return (cos(source.pca, target.pca) + 1) / 2;
  }

  static get collideRadius() {
    return 2 * this.RADIUS;
  }
}

function matchName(n: Pick<CourseBrief, 'catalog' | 'subject'>, d: Pick<Datum, 'catalog' | 'subject'>) {
  return n.catalog === d.catalog && n.subject === d.subject;
}
