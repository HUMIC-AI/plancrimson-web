import * as d3 from 'd3';
import { kdTree } from 'kd-tree-javascript';
import { createRef, useEffect, useMemo } from 'react';
import { useCourseEmbeddingData } from '../../components/ClassesCloudPage/useData';
import { getClassId, getSubjectColor, getUpcomingSemester } from '../../src/lib';
import Layout from '../../components/Layout/Layout';
import { Auth, ClassCache } from '../../src/features';
import { AuthRequiredInstantSearchProvider } from '../../components/AuthRequiredInstantSearchProvider';
import { WithMeili } from '../../components/Layout/WithMeili';
import { ScheduleSyncer } from '../../components/ScheduleSyncer';
import { SearchStateProvider, getDefaultSearchStateForSemester } from '../../src/context/searchState';
import SearchBox from '../../components/SearchComponents/SearchBox/SearchBox';
import Hits from '../../components/SearchComponents/Hits';
import { useMeiliClient } from '../../src/context/meili';
import { useModal } from '../../src/context/modal';
import { useAppDispatch } from '../../src/utils/hooks';

type Datum = {
  id: string;
  subject: string;
  i: number;
  x: number;
  y: number;
};


export default function GraphPage() {
  const userId = Auth.useAuthProperty('uid');

  return (
    <Layout title="Graph">
      <WithMeili userId={userId}>
        {userId && <ScheduleSyncer userId={userId} />}
        <div className="relative flex">
          <SearchSection />
          <Graph />
        </div>
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

/**
 * A 2D d3 force graph of different courses.
 */
function Graph() {
  const dispatch = useAppDispatch();
  const { client } = useMeiliClient();
  const { positions, courses } = useCourseEmbeddingData('all');
  const ref = createRef<SVGSVGElement>();
  const { showCourse } = useModal();

  const width = 800;
  const height = 800;
  const radius = 8;

  useEffect(() => {
    if (!positions || !courses || !ref.current) return;

    console.log('positions', positions.length);
    console.log('courses', courses.length);

    const svg = d3.select(ref.current);

    const nodes: Datum[] = positions.slice(0, 100).map((pos, i) => ({
      ...courses[i], x: pos[0] * 10, y: pos[1] * 10,
    }));

    const links: { source: Datum, target: Datum }[] = [];
    nodes.forEach((source, i) => {
      nodes.forEach((target, j) => {
        if (i < j && source.subject === target.subject) {
          links.push({ source, target });
        }
      });
    });

    console.log('links', links);

    const sim = d3
      .forceSimulation(nodes)
      .force('link', d3.forceLink(links).id((d) => d.id).strength(0.01))
      .force('charge', d3.forceManyBody().strength(-100))
      .force('center', d3.forceCenter())
      .force('x', d3.forceX())
      .force('y', d3.forceY());

    const link = svg.append('g')
      .attr('stroke', '#999')
      .attr('stroke-opacity', 0.6)
      .selectAll('line')
      .data(links)
      .join('line')
      .attr('stroke-width', 2);

    const node = svg.append('g')
      .attr('stroke', '#fff')
      .attr('stroke-width', 1.5)
      .selectAll('circle')
      .data(nodes)
      .join('circle')
      .attr('r', radius)
      .attr('fill', (d) => getSubjectColor(d.subject));

    // node.append('title')
    //   .text((d) => d.id);

    // drag nodes around
    node.call(d3.drag<any, Datum>()
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
      }));

    // click on a node
    node.on('click', (event, d) => {
      dispatch(ClassCache.loadCourses(client, [getClassId(d.id)]))
        .then(([course]) => {
          showCourse(course);
        })
        .catch((err) => console.error(err));
    });

    // expand node on hover
    node.on('mouseover', (event, d) => {
      d3.select(event.target)
        .transition()
        .duration(100)
        .attr('r', radius * 2);
    });

    node.on('mouseout', (event, d) => {
      d3.select(event.target)
        .transition()
        .duration(100)
        .attr('r', radius);
    });

    // update node positions
    sim.on('tick', () => {
      link.attr('x1', (d) => d.source.x)
        .attr('y1', (d) => d.source.y)
        .attr('x2', (d) => d.target.x)
        .attr('y2', (d) => d.target.y);

      node.attr('cx', (d) => d.x)
        .attr('cy', (d) => d.y);
    });

    return () => {
      sim.stop();
      svg.selectAll('*').remove();
    };
  }, [positions, courses]);

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
