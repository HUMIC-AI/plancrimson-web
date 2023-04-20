import * as d3 from 'd3';
import {
  tsne2d, ExtendedClass, allTruthy, Subject,
} from 'plancrimson-utils';


export const metrics = {
  uniform: 'None',
  meanClassSize: 'Class size',
  meanRating: 'Rating',
  meanRecommendation: 'Recommended',
  meanHours: 'Workload',
};

export const metricNames = Object.keys(metrics).sort() as (keyof typeof metrics)[];


export type Embedding = {
  x: number;
  y: number;
  subject: Subject;
  catalogNumber: string;
  title: string;
  id: string;
  metric: number;
};

// turn a list of courses into data for d3
export function makeData(courses: ExtendedClass[], radiusMetric: keyof typeof metrics) {
  let maxMetric = 0;

  const data = allTruthy(courses.map((course): Embedding | null => {
    const id = course.id as keyof typeof tsne2d;
    if (!tsne2d[id]) {
      console.error('no embedding for', id);
      return null;
    }
    const [x, y] = tsne2d[id] as [number, number]; // TODO fix all deduplication stuff
    const metric = radiusMetric === 'uniform' ? 0 : (parseFloat(course[radiusMetric]?.toString() || '') || 0);
    maxMetric = Math.max(metric, maxMetric);
    return {
      x,
      y,
      subject: course.SUBJECT as Subject,
      catalogNumber: course.CATALOG_NBR,
      title: course.Title,
      id: course.id,
      metric,
    };
  }));

  return [data, maxMetric] as const;
}

export function initChart(chartDiv: HTMLDivElement) {
  const chart = d3.select(chartDiv);
  const width = chartDiv.clientWidth;
  const height = chartDiv.clientHeight;

  let [minx, maxx, miny, maxy] = [0, 0, 0, 0];
  const points = Object.values(tsne2d) as [number, number][];
  points.forEach(([x, y]) => {
    minx = Math.min(minx, x);
    maxx = Math.max(maxx, x);
    miny = Math.min(miny, y);
    maxy = Math.max(maxy, y);
  });

  const size = Math.min(width, height);
  const range = (t: number) => [(t - size) / 2, (t + size) / 2];

  const scales = {
    x: d3.scaleLinear([minx, maxx], range(width)),
    y: d3.scaleLinear([miny, maxy], range(height)),
    minx,
    maxx,
    miny,
    maxy,
  };

  const zoom = d3.zoom<SVGSVGElement, unknown>().on('zoom', (ev) => {
    const newX = ev.transform.rescaleX(scales.x);
    const newY = ev.transform.rescaleY(scales.y);
    svg.selectAll<SVGCircleElement, Embedding>('circle')
      .attr('cx', (d) => newX(d.x))
      .attr('cy', (d) => newY(d.y));
  });

  const svg = chart.append('svg')
    .attr('width', width)
    .attr('height', height)
    .call(zoom);

  return {
    svg,
    g: svg.append('g'),
    tooltip: chart.append('div')
      .attr('class', 'absolute text-center -translate-x-1/2 -translate-y-full pointer-events-none w-48 rounded-sm bg-white bg-opacity-70')
      .style('opacity', 0)
      .datum(0),
    scales,
    zoom,
  };
}
