import React, {
  MutableRefObject,
  useEffect, useRef, useState,
} from 'react';
import {
  FaChevronLeft,
  FaChevronRight,
  FaPlus,
} from 'react-icons/fa';
import type { Season, Term } from 'plancrimson-utils';
import {
  Auth,
  Planner, Profile, Schedules,
} from '@/src/features';
import {
  alertUnexpectedError, useAppDispatch, useAppSelector,
} from '@/src/utils/hooks';
import { Requirement } from '@/src/requirements/util';
import { sortSchedules } from '@/src/utils/utils';
import type { DragStatus } from '../Course/CourseCard';
import SemesterColumn, { SemesterDisplayProps } from './SemesterColumn/SemesterColumn';

export interface WithResizeRef {
  resizeRef: React.MutableRefObject<HTMLDivElement>;
}

export function SemestersList({
  resizeRef, highlightedRequirement, columns,
}: WithResizeRef & { highlightedRequirement: Requirement | undefined, columns: SemesterDisplayProps[] }) {
  const dispatch = useAppDispatch();
  const userId = Auth.useAuthProperty('uid')!;
  const userSchedules = useAppSelector(Schedules.selectSchedules);
  const semesterFormat = useAppSelector(Planner.selectSemesterFormat);
  const hiddenIds = useAppSelector(Planner.selectHiddenIds);
  const hiddenTerms = useAppSelector(Planner.selectHiddenTerms);
  const classYear = useAppSelector(Profile.selectClassYear);

  const {
    colWidth, leftIntersecting, rightIntersecting, leftScrollRef, rightScrollRef,
  } = useObserver(resizeRef);

  const semestersContainerRef = useRef<HTMLDivElement>(null!);

  const [dragStatus, setDragStatus] = useState<DragStatus>({
    dragging: false,
  });

  // add a schedule whose semester is before the current earliest semester
  function addPrevSemester() {
    const earliest = sortSchedules(userSchedules)[0];
    const [season, year] = earliest.season === 'Spring'
      ? ['Fall' as Season, earliest.year - 1]
      : ['Spring' as Season, earliest.year];
    dispatch(Schedules.createDefaultSchedule({ season, year }, userId))
      .catch(alertUnexpectedError);
  }

  const showColumns = columns
    .filter((column) => {
      if (semesterFormat === 'all') {
        if (column.chosenScheduleId && column.chosenScheduleId in hiddenIds) {
          return false;
        }
        return true;
      }
      if ((`${column.semester.year}${column.semester.season}` as Term) in hiddenTerms) {
        return false;
      }
      return true;
    });

  return (
    <div className="relative mt-4 flex-1 overflow-x-auto">
      {/* on small screens, this extends as far as necessary */}
      {/* on medium screens and larger, put this into its own box */}
      <div
        className="absolute inset-0 grid grid-flow-col overflow-auto rounded-lg"
        ref={semestersContainerRef}
      >
        {/* when dragging a card, drag over this area to scroll left */}
        <div ref={leftScrollRef} />

        {/* add previous semester button */}
        {semesterFormat === 'selected' && classYear && (
        <button
          type="button"
          className="h-full grow-0 bg-blue-light px-4 transition hover:bg-accent"
          onClick={addPrevSemester}
          name="Add previous semester"
          title="Add previous semester"
        >
          <FaPlus />
        </button>
        )}

        {showColumns.map((column) => (
          <SemesterColumn
            {...{
              ...column,
              colWidth,
              dragStatus,
              setDragStatus,
              highlightedRequirement,
            }}
          />
        ))}

        {/* when dragging, drag over this area to scroll right */}
        <div ref={rightScrollRef} />
      </div>

      {dragStatus.dragging && (
      <>
        {leftIntersecting || (
        <div
          className="absolute inset-y-0 left-0 z-10 flex w-1/6 justify-center bg-black/30 pt-4 text-4xl text-white"
          onDragOver={() => {
            semestersContainerRef.current.scrollBy(-2, 0);
          }}
        >
          <FaChevronLeft />
        </div>
        )}

        {rightIntersecting || (
        <div
          className="absolute inset-y-0 right-0 z-10 flex w-1/6 justify-center bg-black/30 pt-4 text-4xl text-white"
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
  );
}

function useObserver(resizeRef: MutableRefObject<HTMLDivElement>) {
  const leftScrollRef = useRef<HTMLDivElement>(null!);
  const rightScrollRef = useRef<HTMLDivElement>(null!);

  // default w-56 = 224px
  // the resize bar starts at w-24 = 96px
  const [colWidth, setWidth] = useState(224);
  const [leftIntersecting, setLeftIntersecting] = useState(false);
  const [rightIntersecting, setRightIntersecting] = useState(false);

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
    const leftScrollObserver = new IntersectionObserver((entries) => {
      const isIntersecting = entries?.[0]?.isIntersecting;
      if (typeof isIntersecting === 'boolean') {
        setLeftIntersecting(isIntersecting);
      }
    });
    leftScrollObserver.observe(leftScrollRef.current);
    const rightScrollObserver = new IntersectionObserver((entries) => {
      const isIntersecting = entries?.[0]?.isIntersecting;
      if (typeof isIntersecting === 'boolean') {
        setRightIntersecting(isIntersecting);
      }
    });
    rightScrollObserver.observe(rightScrollRef.current);
    return () => {
      resizeObserver.disconnect();
      leftScrollObserver.disconnect();
      rightScrollObserver.disconnect();
    };
  }, [resizeRef]);

  return {
    leftScrollRef,
    rightScrollRef,
    colWidth,
    leftIntersecting,
    rightIntersecting,
  };
}

