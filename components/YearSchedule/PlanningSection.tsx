import React, {
  useEffect, useMemo, useRef, useState,
} from 'react';
import {
  FaArrowsAltH, FaArrowsAltV, FaChevronLeft, FaChevronRight,
} from 'react-icons/fa';
import { Season } from '../../shared/firestoreTypes';
import { classNames, compareSemesters, getUniqueSemesters } from '../../shared/util';
import useCardStyle from '../../src/context/cardStyle';
import useShowAllSchedules from '../../src/context/showAllSchedules';
import useUserData from '../../src/context/userData';
import { Requirement } from '../../src/requirements/util';
import { DragStatus } from '../Course/CourseCard';
import SemesterDisplay from './SemesterDisplay';

type Props = {
  highlightedRequirement: Requirement | undefined;
};

const HeaderSection: React.FC<{
  totalCourses: number;
  resizeRef: React.MutableRefObject<HTMLDivElement>;
}> = function ({ totalCourses, resizeRef }) {
  const { isExpanded, expand } = useCardStyle();
  const { showAllSchedules, setShowAllSchedules } = useShowAllSchedules();

  return (
    <div className="text-white space-y-4">
      <div className="flex flex-col items-center justify-center lg:flex-row xl:justify-start gap-4">
        <span className="whitespace-nowrap">
          Total courses:
          {' '}
          {totalCourses}
          {' '}
          / 32
        </span>
        <div className="flex items-center justify-center gap-4 text-sm">
          <button
            type="button"
            onClick={() => expand(!isExpanded)}
            className={classNames(
              isExpanded ? 'bg-white text-gray-800' : 'bg-gray-800 text-white',
              'rounded-full hover:opacity-50 p-1 border',
            )}
          >
            <FaArrowsAltV />
          </button>
          <button
            type="button"
            onClick={() => setShowAllSchedules(!showAllSchedules)}
            className="py-1 px-2 bg-gray-600 hover:opacity-50 transition-opacity rounded"
          >
            {showAllSchedules
              ? 'Showing all schedules'
              : 'Showing only selected schedules'}
          </button>
        </div>
      </div>
      <div className="flex justify-center xl:justify-start">
        <div
          ref={resizeRef}
          className="flex justify-center rounded py-1 w-24 min-w-[96px] max-w-full resize-x bg-gray-600 overflow-auto"
        >
          <FaArrowsAltH />
        </div>
      </div>
    </div>
  );
};

const PlanningSection: React.FC<Props> = function ({
  highlightedRequirement,
}) {
  const { data, selectSchedule } = useUserData();
  const { showAllSchedules } = useShowAllSchedules();
  const [dragStatus, setDragStatus] = useState<DragStatus>({
    dragging: false,
  });
  // default w-56 = 224px
  // the resize bar starts at w-24 = 96px
  const [colWidth, setWidth] = useState(224);
  const [leftIntersecting, setLeftIntersecting] = useState(false);
  const [rightIntersecting, setRightIntersecting] = useState(false);

  const resizeRef = useRef<HTMLDivElement>(null!);
  const semestersContainerRef = useRef<HTMLDivElement>(null!);
  const leftScrollRef = useRef<HTMLDivElement>(null!);
  const rightScrollRef = useRef<HTMLDivElement>(null!);

  // conditionally show the left and right scroll bars
  // based on the user's current scroll position
  useEffect(() => {
    const resizeObserver = new ResizeObserver((entries) => {
      const newWidth = entries?.[0]?.borderBoxSize?.[0]?.inlineSize;
      if (newWidth) {
        setWidth(Math.max(Math.min(newWidth + 224 - 96, 2048), 224));
      }
    });
    resizeObserver.observe(resizeRef.current);
    const leftScrollObserver = new IntersectionObserver(
      (entries) => {
        const isIntersecting = entries?.[0]?.isIntersecting;
        if (typeof isIntersecting === 'boolean') {
          setLeftIntersecting(isIntersecting);
        }
      },
    );
    leftScrollObserver.observe(leftScrollRef.current);
    const rightScrollObserver = new IntersectionObserver(
      (entries) => {
        const isIntersecting = entries?.[0]?.isIntersecting;
        if (typeof isIntersecting === 'boolean') {
          setRightIntersecting(isIntersecting);
        }
      },
    );
    rightScrollObserver.observe(rightScrollRef.current);
    return () => {
      resizeObserver.disconnect();
      leftScrollObserver.disconnect();
      rightScrollObserver.disconnect();
    };
  }, []);

  const allSemesters: {
    year: number;
    season: Season;
    selectedScheduleId: string | null;
    key: string;
    selectSchedule: React.Dispatch<string | null>;
    highlight?: string;
  }[] = useMemo(() => {
    if (showAllSchedules) {
      return Object.values(data.schedules)
        .sort(compareSemesters)
        .map(({ year, season, id }) => ({
          year,
          season,
          selectedScheduleId: id,
          key: id,
          selectSchedule: (newId) => selectSchedule(year, season, newId),
          highlight: data.selectedSchedules[`${year}${season}`] || undefined,
        }));
    }
    return getUniqueSemesters(data.classYear, Object.values(data.schedules)).map(({ year, season }) => ({
      year,
      season,
      selectedScheduleId: data.selectedSchedules[`${year}${season}`] || null,
      key: year + season,
      selectSchedule: (id) => selectSchedule(year, season, id),
    }));
  }, [data, selectSchedule, showAllSchedules]);

  const totalCourses = useMemo(
    () => Object.values(data.selectedSchedules).reduce(
      (acc, scheduleId) => acc + ((scheduleId && data.schedules[scheduleId]?.classes.length) || 0),
      0,
    ),
    [data.schedules, data.selectedSchedules],
  );

  return (
    <div className="relative bg-gray-800 md:p-4 md:rounded-lg md:shadow-lg row-start-1 md:row-auto overflow-auto max-w-full md:h-full">
      <div className="flex flex-col space-y-4 md:h-full">
        <HeaderSection totalCourses={totalCourses} resizeRef={resizeRef} />

        <div className="relative overflow-x-auto flex-1">
          {/* on small screens, this extends as far as necessary */}
          {/* on medium screens and larger, put this into its own box */}
          <div
            className="md:absolute md:inset-0 grid grid-flow-col rounded-t-lg md:rounded-b-lg overflow-auto"
            ref={semestersContainerRef}
          >
            <div ref={leftScrollRef} />
            {allSemesters.map(
              ({
                year,
                season,
                highlight,
                selectedScheduleId,
                // eslint-disable-next-line @typescript-eslint/no-shadow
                selectSchedule,
                key,
              }) => (
                <SemesterDisplay
                  {...{
                    key,
                    year,
                    season,
                    selectedScheduleId,
                    selectSchedule,
                    colWidth,
                    dragStatus,
                    setDragStatus,
                    highlightedRequirement,
                    highlight,
                  }}
                />
              ),
            )}
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

PlanningSection.whyDidYouRender = true;

export default PlanningSection;
