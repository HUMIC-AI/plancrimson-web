import React, { useEffect, useRef, useState } from 'react';
import { FaArrowsAltH } from 'react-icons/fa';
import { Season } from '../../shared/firestoreTypes';
import { getUniqueSemesters } from '../../shared/util';
import useCardStyle from '../../src/context/cardStyle';
import useUserData from '../../src/context/userData';
import { DragStatus } from '../Course/CourseCard';
import SemesterDisplay from './SemesterDisplay';

type Props = {
  scheduleIds: Record<string, string>;
  highlightedClasses: string[];
  selectSchedule: (year: number, season: Season, schedule: string) => void;
};

const PlanningSection: React.FC<Props> = function ({
  scheduleIds, highlightedClasses, selectSchedule,
}) {
  const { data } = useUserData();
  const [dragStatus, setDragStatus] = useState<DragStatus>({
    dragging: false,
  });
  const { isExpanded, expand } = useCardStyle();
  // default w-52 = 13rem = 208px
  // the resize bar starts at w-24 = 96px
  const [colWidth, setWidth] = useState(208);

  const ref = useRef<HTMLDivElement>(null!);

  useEffect(() => {
    const resizeObserver = new ResizeObserver(([{ borderBoxSize: [{ inlineSize }] }]) => {
      setWidth(Math.max(Math.min(inlineSize + 208 - 96, 2048), 208));
    });
    resizeObserver.observe(ref.current);
    return () => resizeObserver.disconnect();
  }, []);

  return (
    <div className="relative bg-gray-800 p-4 md:rounded-lg md:shadow-lg row-start-1 md:row-auto overflow-auto max-w-full md:h-full">
      <div className="flex flex-col space-y-4 md:h-full">
        <div className="text-white flex flex-col md:flex-row items-center gap-4">
          <span>
            Total courses:
            {' '}
            {Object.values(scheduleIds).reduce((acc, schedule) => acc + (data.schedules[schedule]?.classes.length || 0), 0)}
            /32
          </span>
          <button type="button" onClick={() => expand(!isExpanded)} className="py-2 px-4 bg-gray-600 hover:opacity-50 transition-opacity rounded">
            {isExpanded ? 'Compact cards' : 'Expand cards'}
          </button>
          <div ref={ref} className="flex justify-center rounded py-1 w-24 min-w-[96px] resize-x bg-gray-600 overflow-auto">
            <FaArrowsAltH />
          </div>
        </div>

        <div className="relative overflow-x-auto flex-1">
          <div className="md:absolute md:inset-0 grid grid-flow-col rounded-lg overflow-auto">
            {getUniqueSemesters(data).map(({ year, season }) => (
              <SemesterDisplay
                key={year + season}
                year={year}
                season={season}
                selectedScheduleId={scheduleIds[year + season] || null}
                selectSchedule={(id) => selectSchedule(year, season, id)}
                highlightedClasses={highlightedClasses}
                dragStatus={dragStatus}
                setDragStatus={setDragStatus}
                colWidth={colWidth}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlanningSection;
