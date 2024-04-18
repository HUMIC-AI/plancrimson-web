import { createPortal } from 'react-dom';
import { useUpdateGraph } from './useUpdateGraph';
import { Buttons } from './ExploreGraphButtons';
import { LoadingBars } from '../Layout/LoadingPage';
import { GRAPH_SCHEDULE } from '../../src/features/schedules';
import { useCourseDragContext } from '../../src/context/DragCourseMoveSchedulesProvider';

/**
 * A 2D d3 force graph of different courses.
 */
export function ExploreGraph({
  panelRef,
  scheduleId,
}: {
  panelRef: React.RefObject<HTMLDivElement>;
  scheduleId: string | null;
}) {
  // create the graph
  const { dragStatus, handleDrop } = useCourseDragContext()!;
  const {
    graph, ref, tooltipRef, subjects, elapsed,
  } = useUpdateGraph({ scheduleId });

  const width = 800;
  const height = 800;

  if (!elapsed) {
    return (
      <div className="absolute inset-0">
        <div className="absolute left-1/2 top-1/2 m-auto w-full max-w-xl -translate-x-1/2 -translate-y-1/2">
          <LoadingBars />
        </div>
      </div>
    );
  }

  const allowDrop = dragStatus.dragging && graph && !graph.idInGraph(dragStatus.data.classId);

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
        // this listener is necessary for the drag and drop to work
        // default behaviour stops dropping so we need to prevent it
        // see https://developer.mozilla.org/en-US/docs/Web/API/HTML_Drag_and_Drop_API/Drag_operations#specifying_drop_targets
        onDragStart={(e) => allowDrop && e.preventDefault()}
        onDragOver={(e) => allowDrop && e.preventDefault()}
        onDrop={() => handleDrop({ scheduleId: GRAPH_SCHEDULE, term: null })}
      />

      {/* tooltip */}
      <p
        ref={tooltipRef}
        className="secondary pointer-events-none absolute hidden -translate-x-1/2 translate-y-8 rounded px-1 text-sm"
      />

      {/* use a portal here since buttons depend on graph state but need to be rendered elsewhere */}
      {panelRef.current && graph && createPortal(<Buttons
        graph={graph}
        subjects={subjects}
      />, panelRef.current)}
    </div>
  );
}


