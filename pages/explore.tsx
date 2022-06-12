import * as d3 from 'd3';
import {
  createRef, MutableRefObject, useEffect, useRef,
} from 'react';
import { FaInfo, FaSpinner } from 'react-icons/fa';
import type { InfiniteHitsProvided } from 'react-instantsearch-core';
import { InstantSearch, connectInfiniteHits, Configure } from 'react-instantsearch-dom';
import Layout, { ErrorPage, LoadingPage } from '../components/Layout/Layout';
import AttributeMenu from '../components/SearchComponents/AttributeMenu';
import Tooltip from '../components/Tooltip';
import type { ExtendedClass } from '../shared/apiTypes';
import embeddings from '../shared/assets/embeddings.json';
import { allTruthy, classNames, getSubjectColor } from '../shared/util';
import useSearchState from '../src/context/searchState';
import * as ClassCache from '../src/features/classCache';
import { useModal } from '../src/context/modal';
import { useAppDispatch, useElapsed } from '../src/hooks';
import { InstantMeiliSearchInstance, useMeiliClient } from '../src/meili';
import { Auth } from '../src/features';
import sampleCourses from '../shared/assets/sampleCourses.json';

const SEARCH_DELAY = 500;

type Embedding = {
  x: number;
  y: number;
  subject: string;
  catalogNumber: string;
  title: string;
  id: string;
};
type ObjectsRef = MutableRefObject<ReturnType<typeof initChart> | null>;

// todo:
// - focus on my courses
// - add past courses
// - better search functionality

function initChart(chartDiv: HTMLDivElement) {
  const chart = d3.select(chartDiv);
  const width = chartDiv.clientWidth;
  const height = chartDiv.clientHeight;

  let [minx, maxx, miny, maxy] = [0, 0, 0, 0];
  Object.values(embeddings).forEach(([x, y]) => {
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

type ChartProps =
  | (InfiniteHitsProvided<ExtendedClass> & { demo: false; client: InstantMeiliSearchInstance })
  | (Partial<InfiniteHitsProvided<ExtendedClass>> & { demo: true; client: null });

function ChartComponent({
  hits: foundHits, client, hasPrevious, hasMore, refinePrevious, refineNext, demo,
}: ChartProps) {
  const dispatch = useAppDispatch();
  const objects: ObjectsRef = useRef(null);
  const { showCourse } = useModal();
  const chart = createRef<HTMLDivElement>();
  const hits = demo ? sampleCourses as ExtendedClass[] : foundHits;

  useEffect(() => {
    objects.current = initChart(chart.current!);
  }, []);

  useEffect(() => {
    if (demo) return;
    if (hasMore) {
      console.log('getting more', hasMore);
      setTimeout(() => refineNext(), SEARCH_DELAY);
    } else if (hasPrevious) {
      console.log('getting prev', hasPrevious);
      setTimeout(() => refinePrevious(), SEARCH_DELAY);
    }
  }, [demo, hits.length, hasMore, hasPrevious]);

  useEffect(() => {
    const newData = allTruthy(hits.map((course): Embedding | null => {
      const id = course.id as keyof typeof embeddings;
      if (!embeddings[id]) {
        console.error('no embedding for', id);
        return null;
      }
      const [x, y] = embeddings[id];
      return {
        x, y, subject: course.SUBJECT, catalogNumber: course.CATALOG_NBR, title: course.Title, id: course.id,
      };
    }));

    const { g, tooltip, scales } = objects.current!;
    const dots = g.selectAll<SVGCircleElement, Embedding>('circle').data(newData, (d) => d.id);
    const newDots = dots.enter()
      .append('circle')
      .attr('cx', (d) => scales.x(d.x))
      .attr('cy', (d) => scales.y(d.y))
      .attr('r', 10)
      .style('fill', (d) => getSubjectColor(d.subject))
      .style('cursor', 'pointer')
      .style('opacity', 0);

    newDots
      .on('mouseover', (_, d) => {
        tooltip
          .html(`<p class="font-bold">${d.subject + d.catalogNumber}</p><p>${d.title}</p>`)
          .style('opacity', 1)
          .datum((count) => count + 1);
      })
      .on('mousemove', (ev) => {
        tooltip
          .style('left', `${ev.offsetX}px`)
          .style('top', `${ev.offsetY - 10}px`);
      })
      .on('mouseleave', () => {
        tooltip
          .datum((count) => count - 1)
          .style('opacity', (count) => (count === 0 ? 0 : 1));
      });

    newDots
      .transition()
      .delay((_, i) => SEARCH_DELAY * (i / newDots.size()))
      .duration(SEARCH_DELAY)
      .style('opacity', 1);

    if (!demo) {
      newDots.on('click', (_, d) => {
        dispatch(ClassCache.loadCourses(client.MeiliSearchClient.index('courses'), [d.id])).then(({ payload }) => showCourse(payload[0]));
      });
    }

    dots.exit().remove();
  }, [hits]);

  const buttonClass = (disabled: boolean) => classNames(
    'text-white px-2 py-1 text-sm rounded-md',
    disabled ? 'bg-gray-300' : 'bg-blue-900 interactive',
  );

  function focusRandom() {
    const index = Math.floor(Math.random() * hits.length);
    const {
      svg, g, scales, tooltip,
    } = objects.current!;
    const focusItem = g.select(`circle:nth-child(${index + 1})`);
    if (focusItem.size() === 0) { // just try again if the index doesn't work
      focusRandom();
      return;
    }

    const focus = focusItem.datum() as Embedding;
    // show 1/5 of the total width and height
    const spanx = (scales.maxx - scales.minx) / 5;
    const spany = (scales.maxy - scales.miny) / 5;

    scales.x.domain([focus.x - spanx / 2, focus.x + spanx / 2]);
    scales.y.domain([focus.y - spany / 2, focus.y + spany / 2]);
    svg.selectAll<SVGCircleElement, Embedding>('circle')
      .transition()
      .duration(500)
      .attr('cx', (d) => scales.x(d.x))
      .attr('cy', (d) => scales.y(d.y));

    focusItem.attr('stroke', 'black');

    const [centerx, centery] = [svg.attr('width'), svg.attr('height')].map((t) => parseInt(t, 10) / 2);
    console.log(centerx, centery);
    tooltip
      .html(`<p class="font-bold">${focus.subject + focus.catalogNumber}</p><p>${focus.title}</p>`)
      .style('opacity', 1)
      .style('left', `${centerx}px`)
      .style('top', `${centery - 10}px`);
  }

  return (
    <div className="flex-1 relative">
      <div ref={chart} className="w-full h-full" />
      <div className="absolute top-0 left-0 flex space-x-2 items-center">
        <button
          type="button"
          onClick={focusRandom}
          className={buttonClass(false)}
        >
          Random
        </button>
        <Tooltip text="Currently limited to 1000 courses." direction="right">
          <FaInfo />
        </Tooltip>
        <FaSpinner className={classNames('animate-spin', (!hasMore && !hasPrevious) && 'hidden')} />
      </div>
    </div>
  );
}

const Chart = connectInfiniteHits(ChartComponent);

export default function ExplorePage() {
  const { searchState, setSearchState } = useSearchState();
  const userId = Auth.useAuthProperty('uid');
  const { client, error } = useMeiliClient(userId);
  const elapsed = useElapsed(5000, []);

  if (typeof userId === 'undefined') {
    if (elapsed) return <LoadingPage />;
    return <Layout />;
  }

  if (userId === null) {
    return (
      <Layout className="flex-1 relative">
        <div className="absolute inset-2 flex space-x-2">
          <AttributeMenu />
          <ChartComponent hits={sampleCourses as ExtendedClass[]} demo client={null} />
        </div>
      </Layout>
    );
  }

  if (!client || error) {
    return <ErrorPage>There was an error connecting to the search client. Please try again later!</ErrorPage>;
  }

  return (
    <Layout className="flex-1 relative">
      <InstantSearch
        indexName="courses"
        searchClient={client}
        searchState={searchState}
        onSearchStateChange={(newState) => {
          setSearchState({ ...searchState, ...newState });
        }}
        stalledSearchDelay={500}
      >
        <Configure hitsPerPage={50} />
        <div className="absolute inset-2 flex space-x-2">
          <AttributeMenu showSubjectColor />
          <Chart demo={false} client={client} />
        </div>
      </InstantSearch>
    </Layout>
  );
}
