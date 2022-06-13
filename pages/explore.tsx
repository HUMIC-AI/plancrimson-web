import * as d3 from 'd3';
import {
  createRef, MutableRefObject, useCallback, useEffect, useRef, useState,
} from 'react';
import { FaChevronDown, FaInfo, FaSpinner } from 'react-icons/fa';
import type { InfiniteHitsProvided } from 'react-instantsearch-core';
import { InstantSearch, connectInfiniteHits, Configure } from 'react-instantsearch-dom';
import { Listbox } from '@headlessui/react';
import { getDocs, query, where } from 'firebase/firestore';
import Layout, { errorMessages, ErrorPage, LoadingPage } from '../components/Layout/Layout';
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
import FadeTransition from '../components/FadeTransition';
import { Schema } from '../shared/firestoreTypes';


const SEARCH_DELAY = 1000;
const minRadius = 5;
const maxRadius = 15;
const metrics = {
  uniform: 'None',
  meanClassSize: 'Class size',
  meanRating: 'Rating',
  meanRecommendation: 'Recommended',
  meanHours: 'Workload',
};
const metricNames = Object.keys(metrics).sort() as (keyof typeof metrics)[];


export default function ExplorePage() {
  const { searchState, setSearchState } = useSearchState();
  const userId = Auth.useAuthProperty('uid');
  const { client, error } = useMeiliClient(userId);
  const elapsed = useElapsed(500, []);

  if (typeof userId === 'undefined') {
    if (elapsed) return <LoadingPage />;
    return <Layout />;
  }

  if (userId === null) {
    return (
      <Layout className="md:flex-1 md:relative">
        <div className="md:absolute md:inset-2 flex flex-col md:flex-row space-x-2">
          <AttributeMenu />
          <ChartComponent hits={sampleCourses as ExtendedClass[]} demo client={null} />
        </div>
      </Layout>
    );
  }

  if (!client || error) {
    return <ErrorPage>{errorMessages.meiliClient}</ErrorPage>;
  }

  return (
    <Layout className="md:flex-1 md:relative">
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
        <div className="md:absolute md:inset-2 flex flex-col md:flex-row space-x-2">
          <AttributeMenu showSubjectColor />
          <Chart demo={false} client={client} />
        </div>
      </InstantSearch>
    </Layout>
  );
}


type ObjectsRef = MutableRefObject<ReturnType<typeof initChart> | null>;

type ChartProps =
  | (InfiniteHitsProvided<ExtendedClass> & { demo: false; client: InstantMeiliSearchInstance })
  | (Partial<InfiniteHitsProvided<ExtendedClass>> & { demo: true; client: null });

type Embedding = {
  x: number;
  y: number;
  subject: string;
  catalogNumber: string;
  title: string;
  id: string;
  metric: number;
};

function ChartComponent({
  hits: foundHits = [], client, hasPrevious, hasMore, refinePrevious, refineNext, demo,
}: ChartProps) {
  const dispatch = useAppDispatch();
  const uid = Auth.useAuthProperty('uid');
  const objects: ObjectsRef = useRef(null);
  const { showCourse } = useModal();
  const chart = createRef<HTMLDivElement>();
  const hits = demo ? sampleCourses as ExtendedClass[] : foundHits;
  const [radiusMetric, setRadiusMetric] = useState<keyof typeof metrics>('uniform');

  useEffect(() => {
    objects.current = initChart(chart.current!);
  }, []);

  // only listen to elapsed, so that we search every SEARCH_DELAY seconds
  // restart timer once hits update
  const elapsed = useElapsed(SEARCH_DELAY, [hits.length]);

  useEffect(() => {
    if (demo) return;

    if (hasMore) {
      refineNext();
    } else if (hasPrevious) {
      refinePrevious();
    }
  }, [demo, elapsed]);

  function getDots() {
    return objects.current!.g.selectAll<SVGCircleElement, Embedding>('circle');
  }

  // assume that queries will not return the same number of hits
  useEffect(() => {
    const [newData, maxMetric] = makeData(hits, radiusMetric);
    const dots = getDots().data(newData, (d) => d.id);
    addDots(dots, maxMetric);
  }, [hits.length, radiusMetric]);

  // enter new dots into d3
  const addDots = useCallback((dots: d3.Selection<SVGCircleElement, Embedding, SVGGElement, unknown>, maxMetric: number) => {
    const { scales, tooltip } = objects.current!;

    const newDots = dots.enter()
      .append('circle')
      .attr('cx', (d) => scales.x(d.x))
      .attr('cy', (d) => scales.y(d.y))
      .style('fill', (d) => getSubjectColor(d.subject))
      .attr('r', (minRadius + maxRadius) / 2)
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
      .transition('opacity')
      .duration(SEARCH_DELAY)
      .style('opacity', 1);

    if (!demo && client) {
      newDots.on('click', (_, d) => {
        dispatch(ClassCache.loadCourses(client.MeiliSearchClient.index('courses'), [d.id]))
          .then((courses) => showCourse(courses[0]));
      });
    }

    getDots()
      .transition('r')
      .duration(100)
      .attr('r', (d) => (maxMetric === 0 ? minRadius : minRadius + (maxRadius - minRadius) * (d.metric / maxMetric)));

    dots.exit().remove();
  }, [demo, client]);

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
    getDots()
      .transition()
      .duration(500)
      .attr('cx', (d) => scales.x(d.x))
      .attr('cy', (d) => scales.y(d.y));

    focusItem.attr('stroke', 'black');

    const [centerx, centery] = [svg.attr('width'), svg.attr('height')].map((t) => parseInt(t, 10) / 2);
    tooltip
      .html(`<p class="font-bold">${focus.subject + focus.catalogNumber}</p><p>${focus.title}</p>`)
      .style('opacity', 1)
      .style('left', `${centerx}px`)
      .style('top', `${centery - 10}px`);
  }

  async function focusMine(meiliClient: InstantMeiliSearchInstance, userId: string) {
    objects.current!.g.selectAll('circle').data();
    const q = query(Schema.Collection.schedules(), where('ownerUid', '==', userId));
    const { docs } = await getDocs(q);
    const courseIds = docs.flatMap((doc) => doc.data().classes.map(({ classId }) => classId));
    const loaded = await dispatch(ClassCache.loadCourses(meiliClient.MeiliSearchClient.index('courses'), courseIds));
    const dots = getDots();
    const data = dots.data();
    const [newData, maxMetric] = makeData(loaded, radiusMetric);
    const allDots = dots.data<Embedding>([...data, ...newData], (d) => d.id);
    addDots(allDots, maxMetric);

    console.log('DATA', data);
  }

  const buttonClass = (disabled: boolean) => classNames(
    'text-white px-2 py-1 text-sm rounded-md shadow',
    disabled ? 'bg-gray-300' : 'bg-blue-900 interactive',
  );

  return (
    <div className="md:flex-1 relative min-h-[28rem]">
      <div ref={chart} className="w-full h-full" />
      <div className="absolute top-0 left-0 flex space-x-2 items-center">
        <button
          type="button"
          onClick={focusRandom}
          className={buttonClass(false)}
        >
          Random
        </button>
        {uid && client && (
          <button
            type="button"
            onClick={() => focusMine(client, uid)}
            className={buttonClass(false)}
          >
            My courses
          </button>
        )}
        <Listbox as="div" className="relative inline-block" value={radiusMetric} onChange={setRadiusMetric}>
          <div>
            <Listbox.Button className="flex items-center justify-center bg-blue-900 text-white text-sm px-2 py-1 rounded-md interactive shadow">
              {metrics[radiusMetric]}
              <FaChevronDown className="ml-2 text-xs" />
            </Listbox.Button>
          </div>
          <FadeTransition>
            <Listbox.Options as="div" className="absolute top-full mt-2 rounded shadow-xl border-2 border-gray-400 overflow-hidden list-none">
              {metricNames.map((metric) => (
                <Listbox.Option key={metric} value={metric}>
                  {({ selected }) => (
                    <button
                      type="button"
                      className={classNames(selected ? 'bg-gray-300' : 'bg-white hover:bg-gray-200 transition-colors', 'px-2 py-1 w-full')}
                    >
                      {metrics[metric]}
                    </button>
                  )}
                </Listbox.Option>
              ))}
            </Listbox.Options>
          </FadeTransition>
        </Listbox>
        <Tooltip text="Currently limited to 1000 courses." direction="right">
          <FaInfo />
        </Tooltip>
        <FaSpinner className={classNames('animate-spin', (!hasMore && !hasPrevious) && 'hidden')} />
      </div>
    </div>
  );
}

const Chart = connectInfiniteHits(ChartComponent);

// turn a list of courses into data for d3
function makeData(courses: ExtendedClass[], radiusMetric: keyof typeof metrics) {
  let maxMetric = 0;

  const data = allTruthy(courses.map((course): Embedding | null => {
    const id = course.id as keyof typeof embeddings;
    if (!embeddings[id]) {
      console.error('no embedding for', id);
      return null;
    }
    const [x, y] = embeddings[id];
    const metric = radiusMetric === 'uniform' ? 0 : (parseFloat(course[radiusMetric]?.toString() || '') || 0);
    maxMetric = Math.max(metric, maxMetric);
    return {
      x,
      y,
      subject: course.SUBJECT,
      catalogNumber: course.CATALOG_NBR,
      title: course.Title,
      id: course.id,
      metric,
    };
  }));

  return [data, maxMetric] as const;
}

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
