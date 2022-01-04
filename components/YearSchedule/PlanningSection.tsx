import React, {
  useEffect, useMemo, useRef, useState,
} from 'react';
import { FaArrowsAltH, FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import { Season } from '../../shared/firestoreTypes';
import { getUniqueSemesters } from '../../shared/util';
import useCardStyle from '../../src/context/cardStyle';
import useUserData from '../../src/context/userData';
import { Requirement } from '../../src/requirements/util';
import { DragStatus } from '../Course/CourseCard';
import SemesterDisplay from './SemesterDisplay';

type Props = {
  scheduleIds: Record<string, string>;
  highlightedRequirement: Requirement | undefined;
  selectSchedule: (year: number, season: Season, schedule: string) => void;
};

const PlanningSection: React.FC<Props> = function ({
  scheduleIds,
  highlightedRequirement,
  selectSchedule,
}) {
  const { data } = useUserData();
  const [dragStatus, setDragStatus] = useState<DragStatus>({
    dragging: false,
  });
  const { isExpanded, expand } = useCardStyle();
  // default w-52 = 13rem = 208px
  // the resize bar starts at w-24 = 96px
  const [colWidth, setWidth] = useState(208);
  const [leftIntersecting, setLeftIntersecting] = useState(false);
  const [rightIntersecting, setRightIntersecting] = useState(false);

  const resizeRef = useRef<HTMLDivElement>(null!);
  const semestersContainerRef = useRef<HTMLDivElement>(null!);
  const leftScrollRef = useRef<HTMLDivElement>(null!);
  const rightScrollRef = useRef<HTMLDivElement>(null!);

  useEffect(() => {
    const resizeObserver = new ResizeObserver(
      ([
        {
          borderBoxSize: [{ inlineSize }],
        },
      ]) => {
        setWidth(Math.max(Math.min(inlineSize + 208 - 96, 2048), 208));
      },
    );
    resizeObserver.observe(resizeRef.current);
    const leftScrollObserver = new IntersectionObserver(
      ([{ isIntersecting }]) => {
        setLeftIntersecting(isIntersecting);
      },
    );
    leftScrollObserver.observe(leftScrollRef.current);
    const rightScrollObserver = new IntersectionObserver(
      ([{ isIntersecting }]) => {
        setRightIntersecting(isIntersecting);
      },
    );
    rightScrollObserver.observe(rightScrollRef.current);
    return () => {
      resizeObserver.disconnect();
      leftScrollObserver.disconnect();
      rightScrollObserver.disconnect();
    };
  }, []);

  const semesters = useMemo(() => getUniqueSemesters(data), [data]);

  const totalCourses = useMemo(
    () => Object.values(scheduleIds).reduce(
      (acc, schedule) => acc + (data.schedules[schedule]?.classes.length || 0),
      0,
    ),
    [data.schedules, scheduleIds],
  );

  return (
    <div className="relative bg-gray-800 md:p-4 md:rounded-lg md:shadow-lg row-start-1 md:row-auto overflow-auto max-w-full md:h-full">
      <div className="flex flex-col space-y-4 md:h-full">
        <div className="text-white flex flex-col md:flex-row items-center gap-4">
          <span>
            Total courses:
            {' '}
            {totalCourses}
            {' '}
            / 32
          </span>
          <button
            type="button"
            onClick={() => expand(!isExpanded)}
            className="py-2 px-4 bg-gray-600 hover:opacity-50 transition-opacity rounded"
          >
            {isExpanded ? 'Compact cards' : 'Expand cards'}
          </button>
          <div
            ref={resizeRef}
            className="flex justify-center rounded py-1 w-24 min-w-[96px] resize-x bg-gray-600 overflow-auto"
          >
            <FaArrowsAltH />
          </div>
        </div>

        <div className="relative overflow-x-auto flex-1">
          {/* on small screens, this extends as far as necessary */}
          {/* on medium screens and larger, put this into its own box */}
          <div
            className="md:absolute md:inset-0 grid grid-flow-col rounded-t-lg md:rounded-b-lg overflow-auto"
            ref={semestersContainerRef}
          >
            <div ref={leftScrollRef} />
            {semesters.map(({ year, season }) => (
              <SemesterDisplay
                key={year + season}
                selectedScheduleId={scheduleIds[year + season] || null}
                selectSchedule={(id) => selectSchedule(year, season, id)}
                {...{
                  year,
                  season,
                  highlightedRequirement,
                  dragStatus,
                  setDragStatus,
                  colWidth,
                }}
              />
            ))}
            <div ref={rightScrollRef} />
          </div>

          {dragStatus.dragging && (
            <>
              {leftIntersecting || (
                <div
                  className="absolute inset-y-0 left-0 w-1/6 flex justify-center text-white text-4xl pt-4 bg-gray-800 bg-opacity-30 z-10"
                  onDragOver={() => {
                    semestersContainerRef.current.scrollBy(-2, 0);
                  }}
                >
                  <FaChevronLeft />
                </div>
              )}
              {rightIntersecting || (
                <div
                  className="absolute inset-y-0 right-0 w-1/6 flex justify-center text-white text-4xl pt-4 bg-gray-800 bg-opacity-30 z-10"
                  onDragOver={() => {
                    semestersContainerRef.current.scrollBy(2, 0);
                  }}
                >
                  <FaChevronRight />
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default PlanningSection;
