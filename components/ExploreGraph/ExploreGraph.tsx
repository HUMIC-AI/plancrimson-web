import { createPortal } from 'react-dom';
import { useUpdateGraph } from './Graph';
import { Buttons } from './ExploreGraphButtons';

/**
 * A 2D d3 force graph of different courses.
 */
export function ExploreGraph({
  setHover,
  panelRef,
  scheduleId,
}: {
  setHover: (id: string | null) => void;
  panelRef: React.RefObject<HTMLDivElement>;
  scheduleId: string | null;
}) {
  // create the graph
  const {
    graph, ref, tooltipRef, subjects,
  } = useUpdateGraph({
    setHover, scheduleId,
  });

  const width = 800;
  const height = 800;

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


