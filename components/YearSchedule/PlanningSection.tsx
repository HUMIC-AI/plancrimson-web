import React, {
  useRef,
} from 'react';
import {
  FaPlus,
} from 'react-icons/fa';
import type { Term } from '@/src/lib';
import {
  Auth, Planner, Profile, Schedules,
} from '@/src/features';
import {
  alertUnexpectedError, useAppDispatch, useAppSelector,
} from '@/src/utils/hooks';
import { Requirement } from '@/src/requirements/util';
import { getSemesterBeforeEarliest } from '@/src/utils/schedules';
import SemesterColumn, { SemesterDisplayProps } from './SemesterColumn/SemesterColumn';
import { DragObservers, useObserver } from './SemesterColumn/DragObservers';
import { DragAndDropProvider } from './SemesterColumn/DragAndDrop';

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

  // add a schedule whose semester is before the current earliest semester
  function addPrevSemester() {
    const semester = getSemesterBeforeEarliest(userSchedules);
    dispatch(Schedules.createDefaultSchedule(semester, userId))
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
    <DragAndDropProvider>
      <div className="relative mt-4 flex-1">
        <div className="absolute inset-0 overflow-scroll">
          {/* on small screens, this extends as far as necessary */}
          {/* on medium screens and larger, put this into its own box */}
          <div
            className="mx-auto flex h-full w-max overflow-hidden rounded-lg"
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
                  highlightedRequirement,
                }}
              />
            ))}

            {/* when dragging, drag over this area to scroll right */}
            <div ref={rightScrollRef} />
          </div>

          <DragObservers
            leftIntersecting={leftIntersecting}
            rightIntersecting={rightIntersecting}
            semestersContainerRef={semestersContainerRef}
          />
        </div>
      </div>
    </DragAndDropProvider>
  );
}
