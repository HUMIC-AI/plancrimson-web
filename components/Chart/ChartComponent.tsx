import { Listbox } from "@headlessui/react";
import { InstantMeiliSearchInstance } from "@meilisearch/instant-meilisearch";
import FadeTransition from "components/FadeTransition";
import Tooltip from "components/Tooltip";
import { Auth } from "src/features";
import { query, where, getDocs } from "firebase/firestore";
import { MutableRefObject, useRef, createRef, useState, useEffect, useCallback } from "react";
import { FaChevronDown, FaInfo, FaSpinner } from "react-icons/fa";
import { InfiniteHitsProvided } from "react-instantsearch-core";
import { ExtendedClass } from "shared/apiTypes";
import Schema from "shared/schema";
import { getSubjectColor, getAllClassIds, classNames, allTruthy } from "shared/util";
import { useModal } from "src/context/modal";
import { ClassCache } from "src/features";
import { useAppDispatch, useElapsed } from "src/hooks";
import sampleCourses from 'shared/assets/sampleCourses.json';
import * as d3 from 'd3'
import { Embedding, initChart, makeData, metricNames, metrics } from "./chartHelpers";


const SEARCH_DELAY = 1000;
const minRadius = 5;
const maxRadius = 15;


type ObjectsRef = MutableRefObject<ReturnType<typeof initChart> | null>;

type ChartProps =
  | (InfiniteHitsProvided<ExtendedClass> & { demo: false; client: InstantMeiliSearchInstance })
  | (Partial<InfiniteHitsProvided<ExtendedClass>> & { demo: true; client: null });


/**
 * Renders the actual chart and canvas containing the course visualization.
 */
export default function ChartComponent({
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

    if (hasMore && refineNext) {
      refineNext();
    } else if (hasPrevious && refinePrevious) {
      refinePrevious();
    }
  }, [demo, elapsed]);

  const getDots = () => objects.current!.g.selectAll<SVGCircleElement, Embedding>('circle');

  const getRadius = (metric: number, maxMetric: number) => (
    maxMetric === 0 ? minRadius : minRadius + (maxRadius - minRadius) * (metric / maxMetric)
  );

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
        dispatch(ClassCache.loadCourses(client, [d.id]))
          .then((courses) => showCourse(courses[0]));
      });
    }

    getDots()
      .transition('r')
      .duration(100)
      .attr('r', (d) => getRadius(d.metric, maxMetric));

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
    const q = query(Schema.Collection.schedules(), where('ownerUid', '==', userId));
    const { docs } = await getDocs(q);
    const courseIds = getAllClassIds(docs.map((doc) => doc.data()));

    const loaded = await dispatch(ClassCache.loadCourses(meiliClient, courseIds));

    const dots = getDots();
    const data = dots.data();
    const [newData, maxMetric] = makeData(loaded.filter((e) => !data.find((d) => d.id === e.id)), radiusMetric);
    const allDots = dots.data<Embedding>([...data, ...newData], (d) => d.id);
    addDots(allDots, maxMetric);

    getDots()
      .filter((d) => courseIds.includes(d.id))
      .attr('stroke', 'black')
      .transition()
      .duration(500)
      .style('opacity', 1)
      .attr('r', maxRadius * 2)
      .transition()
      .duration(500)
      .attr('r', (d) => getRadius(d.metric, maxMetric));
  }

  const buttonClass = (disabled: boolean) => classNames(
    'text-white px-2 py-1 text-sm rounded-md shadow',
    disabled ? 'bg-gray-300' : 'bg-blue-900 interactive',
  );

  return (
    <div className="relative min-h-[28rem] md:flex-1">
      <div ref={chart} className="h-full w-full" />
      <div className="absolute top-0 left-0 flex items-center space-x-2">
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
            <Listbox.Button className="interactive flex items-center justify-center rounded-md bg-blue-900 px-2 py-1 text-sm text-white shadow">
              {metrics[radiusMetric]}
              <FaChevronDown className="ml-2 text-xs" />
            </Listbox.Button>
          </div>
          <FadeTransition>
            <Listbox.Options as="div" className="absolute top-full mt-2 list-none overflow-hidden rounded border-2 border-gray-400 shadow-xl">
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
