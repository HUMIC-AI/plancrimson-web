import * as d3 from 'd3';
import { getAnalytics, logEvent } from 'firebase/analytics';
import { CourseBrief } from '../ClassesCloudPage/useData';
import {
  Subject,
  cos,
  getSubjectColor,
} from '../../src/lib';
import { EMOJI_SCALES, RatingType } from './HoveredCourseInfo';

export type DatumBase = CourseBrief & {
  pca: number[];
  catalog: string;
};

export type Datum = DatumBase & {
  x: number;
  y: number;
};

export type LinkDatum = {
  source: Datum;
  target: Datum;
};

export type StringLink = { source: string; target: string; };

export type NodeId = string | { id: string };

export type Simulation = d3.Simulation<Datum, LinkDatum>;

export type InitGraphProps = {
  setHover: (id: string | null) => void;
  scheduleId: string | null;
};

export type InitGraphPropsRequired = InitGraphProps & {
  positions: number[][];
  courses: CourseBrief[];
};

export type CourseGroupSelection = d3.Selection<SVGGElement, Datum, SVGGElement, unknown>;

const getColor = (d: DatumBase) => getSubjectColor(d.subject, {
  // saturation: (d.meanRating ? d.meanRating : 3) / 5,
  // opacity: (d.meanHours ? d.meanHours : 3) / 5,
  saturation: 0.7,
  lightness: 0.7,
  opacity: 0.95,
});
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

/**
 * The entire d3 graph visualization.
 * appendNodes and removeNodes should be used to update the graph.
 * These will also call the `onAppendCourses` and `onRemoveCourses` callbacks.
 * These callbacks synchronize the nodes with the redux store (specifically
 * the schedule with id {@link GRAPH_SCHEDULE}).
 */
export class Graph {
  public sim: Simulation;

  public flip = false;

  private phase: 'init' | 'wait' | 'info' | 'ready' = 'init';

  private svg: d3.Selection<SVGSVGElement, unknown, null, undefined>;

  private tooltip: d3.Selection<HTMLParagraphElement, unknown, null, undefined>;

  private zoom: d3.ZoomBehavior<SVGSVGElement, unknown>;

  private focusedCourse: {
    id: string | null;
    reason: 'hover' | 'fix';
  } = { id: null, reason: 'hover' };

  private width: number;

  private height: number;

  private highlightedIds: string[] = [];

  private nodeGroup: d3.Selection<SVGGElement, unknown, null, unknown>;

  private node: CourseGroupSelection;

  private linkGroup: d3.Selection<SVGGElement, unknown, null, unknown>;

  private link: d3.Selection<SVGLineElement, LinkDatum, SVGGElement, unknown>;

  private static readonly RADIUS = 5;

  private static readonly T_DURATION = 150;

  private static readonly MAX_LINK_STRENGTH = 0.3;

  private static readonly CHARGE_STRENGTH = -100;

  private static readonly NUM_NEIGHBOURS = 3;

  private static readonly CENTER_STRENGTH = 0.05;

  private static readonly PULSE_DURATION = 750;

  constructor(
    svgDom: SVGSVGElement,
    tooltipDom: HTMLParagraphElement,
    public readonly positions: number[][],
    public readonly courses: CourseBrief[],
    public readonly fixedScheduleId: string | null,
    private setHover: (id: string | null) => void,
    private setSubjects: (subjects: Subject[]) => void,
    private ratingField: RatingType,
    private setRatingField: (ratingField: RatingType) => void,
    private showInstructions: () => void,
    private onAppendCourses: (ids: string[]) => void,
    private onRemoveCourses: (ids: string[]) => void,
  ) {
    this.svg = d3.select(svgDom);
    this.tooltip = d3.select(tooltipDom);

    // these get initialized later in the component by the user
    this.sim = d3
      .forceSimulation<Datum>()
      .force('link', d3.forceLink<Datum, LinkDatum>().id((d) => d.id).strength(Graph.getLinkStrength))
      .force('charge', d3.forceManyBody().strength(Graph.CHARGE_STRENGTH))
      .force('collide', d3.forceCollide<Datum>((d) => Graph.getRadius(d) + Graph.RADIUS * 2).iterations(2))
      .force('x', d3.forceX().strength(Graph.CENTER_STRENGTH))
      .force('y', d3.forceY().strength(Graph.CENTER_STRENGTH))
      .force('center', d3.forceCenter());

    this.linkGroup = this.svg.append('g')
      .attr('stroke-opacity', 0.7)
      .attr('stroke-linecap', 'round');

    this.link = this.linkGroup.selectAll<SVGLineElement, LinkDatum>('line');

    // set initial node properties here
    // properties get transitioned later
    this.nodeGroup = this.svg.append('g')
      .attr('text-anchor', 'middle')
      .attr('dominant-baseline', 'central')
      .attr('fill', 'rgb(var(--color-primary))')
      .attr('stroke', 'rgb(var(--color-primary))')
      .attr('cursor', 'grab');

    this.node = this.nodeGroup.selectAll<SVGGElement, Datum>('g');

    // update node positions
    this.sim.on('tick', this.ticked.bind(this));

    this.svg
      .on('click contextmenu', (event) => {
        event.preventDefault();
        this.focusCourse(null);
      });

    this.width = svgDom.width.baseVal.value;
    this.height = svgDom.height.baseVal.value;

    this.zoom = d3.zoom<SVGSVGElement, unknown>()
      .extent([[0, 0], [this.width, this.height]])
      .scaleExtent([1, 4])
      .on('zoom', (event) => {
        this.linkGroup.attr('transform', event.transform);
        this.nodeGroup.attr('transform', event.transform);
      });

    this.svg.call(this.zoom);
    this.svg.call(this.zoom.transform, this.defaultZoom);
  }

  get defaultZoom() {
    return d3.zoomIdentity.translate(-this.width / 4, 0).scale(1.5);
  }

  get rating() {
    return this.ratingField;
  }

  private addCircle(enter: CourseGroupSelection) {
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
      Graph.transitionRadius(this, Graph.getRadius(d));
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

  public setFlip(flip: boolean) {
    this.flip = flip;
  }

  public resetZoom() {
    this.svg.transition('svg-zoom')
      .duration(Graph.PULSE_DURATION)
      .call(this.zoom.transform, this.defaultZoom);
  }

  public setRatingType(ratingType: RatingType) {
    this.ratingField = ratingType;
    this.setRatingField(ratingType);
    this.node.select('text.emoji').text(this.getEmoji.bind(this));
  }

  public focusCourse(id: string | null) {
    console.debug('fixing node', id);
    // deselect a currently selected node
    id = this.focusedCourse.id === id && this.focusedCourse.reason === 'fix' ? null : id;

    if (id) this.setHover(id);
    else if (this.focusedCourse) this.setHover(null);

    this.focusedCourse = { id, reason: 'fix' };

    const fixedNode = this.currentData.find((d) => d.id === this.focusedCourse.id);
    if (fixedNode) {
      this.svg.transition('svg-zoom')
        .duration(Graph.PULSE_DURATION)
        .call(this.zoom.transform, this.defaultZoom.translate(-fixedNode.x, -fixedNode.y));
    }

    this.renderHighlights();
  }

  private addNewNeighbours(d: Datum, numNeighbours = Graph.NUM_NEIGHBOURS) {
    const nodes: Datum[] = this.positions.filter((_, i) => {
      const course = this.courses[i] as DatumBase;
      return !this.currentData.some(({ catalog, subject }) => catalog === course.catalog && subject === course.subject);
    })
      .map((pca, i) => ({ d: cos(d.pca, pca), i }))
      .sort((a, b) => (this.flip ? -1 : +1) * (b.d - a.d))
      .slice(0, numNeighbours)
      .map(({ i }) => ({
        ...this.courses[i],
        pca: this.positions[i],
        x: d.x + Math.random() * Graph.RADIUS * 4 - Graph.RADIUS * 2,
        y: d.y + Math.random() * Graph.RADIUS * 4 - Graph.RADIUS * 2,
      }) as Datum);

    const links = nodes.map((t) => ({ source: d.id, target: t.id }));
    this.appendNodes(nodes, links);
  }

  private renderHighlights() {
    return this.node
      .select('circle')
      .transition('highlight-t')
      .duration(Graph.T_DURATION)
      .attr('stroke-width', this.getStrokeWidth.bind(this))
      .attr('stroke-opacity', (d) => (this.getStrokeWidth(d) > 0 ? 1 : 0));
  }

  private getStrokeWidth(d: Datum) {
    if (this.focusedCourse.id === d.id && this.focusedCourse.reason === 'fix') return 8;
    if (this.highlightedIds.includes(d.id)) return 6;
    return 0;
  }

  /**
   * Transition the radius of nodes in the selection
   */
  private static transitionRadius(g: SVGGElement, radius: number, duration = Graph.T_DURATION): readonly [CircleTransition, TextTransition] {
    const group = d3.select<SVGGElement, Datum>(g);

    const circleTransition = group.selectChildren<SVGCircleElement, null>('circle')
      .transition('radius-t')
      .duration(duration)
      .attr('r', radius);

    const textTransition = group.selectChildren<SVGTextElement, null>('text')
      .transition('radius-t')
      .duration(duration)
      .attr('font-size', `${radius}px`);

    return [circleTransition, textTransition] as const;
  }

  /** Gets called whenever nodes are updated */
  private updateNodesInternal() {
    // tell simulation about new nodes and links
    this.sim.nodes(this.currentData);
    this.sim.force<d3.ForceLink<Datum, LinkDatum>>('link')!.links(this.link.data());
    this.sim.alpha(1).restart();

    // update link properties after strings are populated
    this.link.attr('stroke-width', (d) => 0.5 + Graph.RADIUS * getLinkOpacity(d));

    // callbacks
    this.setSubjects([...new Set(this.currentData.map((d) => d.subject))]);

    if (!this.currentData.some((d) => d.id === this.focusedCourse.id)) {
      this.focusCourse(null);
    }

    if (this.phase === 'init') {
      this.setPhase('wait');
    }
  }

  private pulse(c: SVGGElement, radius: number, grow = true) {
    const [circleTransition] = Graph.transitionRadius(c, radius + (grow ? Graph.RADIUS : 0), Graph.PULSE_DURATION);
    circleTransition.on('end', () => this.pulse(c, radius, !grow));
  }

  get currentData() {
    return this.node.data();
  }

  /**
   * Main update function for entering nodes into the graph.
   * Use {@link DatumBase} since we don't need to initialize x and y.
   */
  public appendNodes(nodesToAdd: DatumBase[], idLinks: StringLink[]) {
    console.debug('updating graph', nodesToAdd.length, idLinks.length);

    nodesToAdd = this.getNewNodes(nodesToAdd);
    idLinks = this.getNewLinks(idLinks);

    if (nodesToAdd.length === 0 && idLinks.length === 0) return;

    this.link = this.link
      .data(this.link.data().concat(idLinks.map((d) => ({ ...d }) as unknown as LinkDatum)), (d) => `${stringify(d.source)}:${stringify(d.target)}`)
      .join((enter) => enter.append('line')
        .attr('stroke', this.flip ? 'rgb(var(--color-blue-primary))' : 'rgb(var(--color-gray-primary))')
        .call(this.addLineEventListeners.bind(this)));

    this.node = this.node
      .data(this.currentData.concat(nodesToAdd.map((d) => ({ ...d }) as Datum)), (d) => d.id)
      .join((enter) => enter.append('g')
        .call(this.addCircle.bind(this))
        .call(this.addNodeEventListeners.bind(this)));

    // callback
    this.onAppendCourses(nodesToAdd.map((d) => d.id));

    this.updateNodesInternal();
  }

  public getNewNodes<T extends NodeId>(nodes: T[]) {
    return nodes.filter((d) => !this.currentData.some((n) => n.id === stringify(d)));
  }

  /** Return current nodes that are not present in the provided list */
  public getNodesNotIn<T extends NodeId>(nodes: T[]) {
    return this.currentData.filter((d) => !nodes.some((n) => stringify(n) === d.id));
  }

  private getNewLinks(links: StringLink[]) {
    return links.filter((d) => !this.link.data().some((l) => sameLink(l, d)));
  }

  public getLinksWithoutNodes<T extends NodeId>(ids: T[]) {
    return this.link.data().filter(({ source, target }) => !ids.some(
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

  /**
   * Add event listeners to each node
   */
  private addNodeEventListeners(n: CourseGroupSelection) {
    // drag nodes around
    const drag = d3.drag<SVGGElement, Datum>()
      .on('start', (event) => {
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
        this.nodeGroup.attr('cursor', 'grab');
      });

    const graph = this;

    n
      .call(drag)
      // expand node on hover
      .on('mouseover', function (event, d) {
        // if we're waiting for user to interact and they do,
        // remove the "click me" label and reset radii
        if (graph.phase === 'wait') {
          return graph.setPhase('info');
        }

        // don't react if info modal is open
        if (graph.phase === 'info') return;

        console.debug('mousing over');

        Graph.transitionRadius(this, Graph.getRadius(d) + Graph.RADIUS * 2);
        if (graph.focusedCourse.id === null || graph.focusedCourse.reason === 'hover') {
          graph.setHover(d.id);
          graph.focusedCourse = { id: d.id, reason: 'hover' };
        }
        graph.showTooltipAt(d.subject + d.catalog, event.clientX, event.clientY);
      })
      .on('mousemove', (event) => {
        graph.moveTooltip(event.clientX, event.clientY);
      })
      .on('mouseout', function (event, d) {
        Graph.transitionRadius(this, Graph.getRadius(d));
        graph.hideTooltip();
      })
      .on('click', (event, d) => {
        event.preventDefault();
        event.stopPropagation();
        logEvent(getAnalytics(), 'explore_neighbours', {
          course: d,
        });
        graph.addNewNeighbours(d);
      })
      .on('contextmenu', (event, d) => {
        event.preventDefault();
        event.stopPropagation();
        graph.focusCourse(d.id);
      });
  }

  private showTooltipAt(text: string, x: number, y: number) {
    this.tooltip
      .classed('hidden', false)
      .text(text);
    this.moveTooltip(x, y);
  }

  private addLineEventListeners(l: d3.Selection<SVGLineElement, LinkDatum, SVGGElement, unknown>) {
    const graph = this;
    l
      .on('mouseover', (event, d) => {
        const percent = Math.round(getLinkOpacity(d) * 100);
        graph.showTooltipAt(`${percent}%`, event.clientX, event.clientY);
      })
      .on('mousemove', (event) => {
        graph.moveTooltip(event.clientX, event.clientY);
      })
      .on('mouseout', () => {
        graph.hideTooltip();
      });
  }

  public highlightSubject(subject: Subject | null) {
    console.debug('highlighting subject', this, subject);
    const ids = this.currentData.filter((d) => d.subject === subject).map((d) => d.id);
    this.highlightedIds = ids;
    this.renderHighlights();
  }

  public removeNodes(idsToRemove: string[]) {
    console.debug('removing nodes', idsToRemove.length);

    if (idsToRemove.length === 0) return;

    const nodes = this.getNodesNotIn(idsToRemove);
    this.node = this.node.data(nodes, (d) => d.id);
    this.node.exit()
      .transition('radius-t')
      .duration(Graph.T_DURATION)
      .attr('r', 0)
      .remove();

    // remove links that are no longer connected
    const links = this.getLinksWithoutNodes(idsToRemove);
    this.link = this.link.data(links);
    this.link.exit()
      .transition('link-t')
      .duration(Graph.T_DURATION)
      .attr('stroke-opacity', 0)
      .remove();

    this.onRemoveCourses(idsToRemove);

    this.updateNodesInternal();
  }

  private getEmoji(d: Datum) {
    const v = this.ratingField === 'meanHours'
      ? 5 * (d.meanHours! / 20)
      : 5 * ((d.meanRating! ** 2) / 25);
    return EMOJI_SCALES[this.ratingField][Math.max(0, Math.min(4, Math.floor(v)))];
  }

  private static getLinkStrength(link: LinkDatum) {
    return Graph.MAX_LINK_STRENGTH * getLinkOpacity(link);
  }

  public static getRadius(d: CourseBrief) {
    return Graph.RADIUS * (d.meanClassSize ? Math.sqrt(d.meanClassSize) : Math.sqrt(20));
  }

  public toDatum(id: string) {
    const course = this.courses.find((c) => c.id === id);
    if (!course) return null;
    return { ...course, pca: this.positions[course.i] } as DatumBase;
  }

  public setPhase(newPhase: Graph['phase']) {
    if (newPhase === 'init') {
      this.setHover(null);
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
        .text('Click me!');

      const pulse = this.pulse.bind(this);

      this.node.each(function (d) {
        pulse(this, Graph.getRadius(d), true);
      });
    } else if (newPhase === 'info') {
      // triggered when user hovers over a "click me" node
      // fade out click me text
      this.node.selectChildren('text.click-me')
        .transition()
        .duration(Graph.PULSE_DURATION)
        .attr('opacity', 0)
        .remove();

      // interrupt current transitions
      this.node.selectAll('circle, text').interrupt('radius-t');

      this.node.select('circle')
        .transition('radius-t')
        .duration(Graph.PULSE_DURATION)
        .attr('r', Graph.getRadius)
        .on('end interrupt', this.showInstructions);

      this.node.select('text.emoji')
        .transition('radius-t')
        .duration(Graph.PULSE_DURATION)
        .attr('font-size', (d) => `${Graph.getRadius(d)}px`);
    }

    this.phase = newPhase;
  }
}

function getLinkOpacity({ source, target }: LinkDatum) {
  return (cos(source.pca, target.pca) + 1) / 2;
}
