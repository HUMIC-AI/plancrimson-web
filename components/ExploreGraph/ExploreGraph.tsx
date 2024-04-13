import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useCourseEmbeddingData } from '../ClassesCloudPage/useData';
import { Schedules } from '../../src/features';
import { useAppSelector } from '../../src/utils/hooks';
import { DatumBase, useUpdateGraph } from './initGraph';
import { Buttons } from './ExploreGraphButtons';

/**
 * A 2D d3 force graph of different courses.
 */
export function ExploreGraph({
  onHover,
  onFix,
  panelRef,
}: {
  onHover: (id: string | null) => void;
  onFix: (id: string | null) => void;
  panelRef: React.RefObject<HTMLDivElement>;
}) {
  const { positions, courses } = useCourseEmbeddingData('all', undefined, 'pca');
  const chosenSchedule = useAppSelector(Schedules.selectSchedule('GRAPH_SCHEDULE'));
  const prevIds = useRef<string[]>();

  // create the graph
  const { graph, ref, subjects } = useUpdateGraph({
    positions, courses, onHover, onFix,
  });

  const width = 800;
  const height = 800;

  useEffect(() => {
    if (!graph || !chosenSchedule?.classes || !courses || !positions) return;

    const nodes: DatumBase[] = chosenSchedule.classes.map((id) => {
      const courseBrief = courses.find((c) => c.id === id)!;
      return {
        ...courseBrief,
        pca: positions[courseBrief.i],
      };
    });

    graph.appendNodes(nodes, []);
    if (prevIds.current) {
      const removed = prevIds.current.filter((id) => !chosenSchedule.classes!.includes(id));
      if (removed.length > 0) {
        graph.removeNodes(removed);
      }
    }
    prevIds.current = [...chosenSchedule.classes];
  }, [chosenSchedule?.classes, courses, graph, positions]);

  return (
    <div className="absolute inset-0">
      <svg
        ref={ref}
        width={width}
        height={height}
        // center the graph in the svg
        viewBox={`${-width / 2} ${-height / 2} ${width} ${height}`}
        className="h-full w-full"
        preserveAspectRatio="xMidYMid meet"
      />
      {/* use a portal here since buttons depend on graph state but need to be rendered elsewhere */}
      {panelRef.current && graph && createPortal(<Buttons
        graph={graph}
        subjects={subjects}
      />, panelRef.current)}
    </div>
  );
}


