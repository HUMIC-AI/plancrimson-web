import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useCourseEmbeddingData } from '../ClassesCloudPage/useData';
import { Schedules } from '../../src/features';
import { useAppDispatch, useAppSelector } from '../../src/utils/hooks';
import { DatumBase, GraphState, useUpdateGraph } from './initGraph';
import { CuteSwitch } from '../Utils/CuteSwitch';
import { Subject, getSubjectColor } from '../../src/lib';

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
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const { graph, ref } = useUpdateGraph({
    positions, courses, onHover, onFix, setSubjects,
  });
  const chosenSchedule = useAppSelector(Schedules.selectSchedule('GRAPH_SCHEDULE'));
  const prevIds = useRef<string[]>();

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

    graph.update(nodes, []);
    if (prevIds.current) {
      const removed = prevIds.current.filter((id) => !chosenSchedule.classes!.includes(id));
      graph.remove(removed);
    }
    prevIds.current = [...chosenSchedule.classes];
  }, [chosenSchedule?.classes, courses, graph, positions]);

  return (
    <div className="absolute inset-0">
      <svg
        ref={ref}
        width={width}
        height={height}
        viewBox={`${-width / 2} ${-height / 2} ${width} ${height}`}
        className="h-full w-full"
        preserveAspectRatio="xMidYMid meet"
      />
      {/* use a portal here since buttons depend on graph state but need to be rendered elsewhere */}
      {panelRef.current && graph && createPortal(<Buttons
        reset={graph.reset}
        resetZoom={graph.resetZoom}
        setFlip={graph.setFlip}
        subjects={subjects}
        highlight={graph.highlight}
      />, panelRef.current)}
    </div>
  );
}

function Buttons({
  reset, resetZoom, setFlip, subjects, highlight,
}: Pick<GraphState, 'reset' | 'resetZoom' | 'setFlip' | 'highlight'> & { subjects: Subject[] }) {
  const dispatch = useAppDispatch();
  const [flip, setToggleFlip] = useState(false);

  return (
    <div className="absolute right-full top-8 mr-2 flex flex-col items-end justify-center space-y-2">
      <button
        type="button"
        className="secondary button"
        onClick={() => {
          reset();
          dispatch(Schedules.clearSchedule('GRAPH_SCHEDULE'));
        }}
      >
        Reset
      </button>
      <button
        type="button"
        className="secondary button"
        onClick={resetZoom}
      >
        Reset zoom
      </button>
      <div className="flex items-center">
        <span className="mr-2 whitespace-nowrap">Add opposites</span>
        <CuteSwitch
          enabled={flip}
          onChange={(checked) => {
            setFlip(checked);
            setToggleFlip(checked);
          }}
        />
      </div>

      <ul className="absolute top-full flex flex-col items-end text-xs">
        {subjects.map((s) => (
          <li
            key={s}
            className="flex items-center"
            onMouseEnter={() => highlight(s)}
            onMouseLeave={() => highlight(null)}
          >
            {s}
            <span className="ml-1 h-2 w-2 rounded-full" style={{ backgroundColor: getSubjectColor(s) }} />
          </li>
        ))}
      </ul>
    </div>
  );
}
