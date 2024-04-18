import React, {
  useRef,
} from 'react';
import {
  FaPlus,
} from 'react-icons/fa';
import { Semester, semesterToTerm } from '@/src/lib';
import {
  Auth, Planner, Profile, Schedules, Settings,
} from '@/src/features';
import {
  alertUnexpectedError, useAppDispatch, useAppSelector,
} from '@/src/utils/hooks';
import { Requirement } from '@/src/requirements/util';
import {
  getSemesterBeforeEarliest, isListOfScheduleIds,
} from '@/src/utils/schedules';
import { ListOfScheduleIdOrSemester } from '@/src/types';
import { DragObservers, useObserver } from './SemesterColumn/DragObservers';
import { DragAndDropProvider } from './SemesterColumn/DragAndDrop';
import SemesterColumn from './SemesterColumn/SemesterColumn';
import CourseCardStyleProvider from '../../src/context/CourseCardStyleProvider';

export interface WithResizeRef {
  resizeRef: React.MutableRefObject<HTMLDivElement>;
}

export function SemestersList({
  resizeRef, highlightedRequirement, columns,
}: WithResizeRef & { highlightedRequirement: Requirement | undefined, columns: ListOfScheduleIdOrSemester }) {
  const dispatch = useAppDispatch();
  const userId = Auth.useAuthProperty('uid')!;
  const userSchedules = useAppSelector(Schedules.selectSchedules);
  const hiddenIds = useAppSelector(Planner.selectHiddenIds);
  const hiddenTerms = useAppSelector(Planner.selectHiddenTerms);
  const classYear = useAppSelector(Profile.selectClassYear);

  const {
    colWidth, leftIntersecting, rightIntersecting, leftScrollRef, rightScrollRef,
  } = useObserver(resizeRef);

  const semestersContainerRef = useRef<HTMLDivElement>(null!);

  // add a schedule whose semester is before the current earliest semester
  async function addPrevSemester() {
    try {
      const semester = getSemesterBeforeEarliest(userSchedules);
      const { payload } = await dispatch(Schedules.createDefaultSchedule(semester, userId));
      await dispatch(Settings.chooseSchedule({
        scheduleId: payload.id,
        term: semesterToTerm(semester),
      }));
    } catch (e) {
      alertUnexpectedError(e);
    }
  }

  const isScheduleIds = isListOfScheduleIds(columns);

  const showColumns = isScheduleIds
    ? columns.filter((column) => !(column in hiddenIds))
    : columns.filter((column) => !(semesterToTerm(column) in hiddenTerms));

  return (
    <DragAndDropProvider>
      <div className="relative mt-4 flex-1">
        <div className="absolute inset-0 overflow-scroll" ref={semestersContainerRef}>
          <div className="mx-auto flex h-full w-max overflow-hidden rounded-lg">
            {/* when dragging a card, drag over this area to scroll left */}
            <div ref={leftScrollRef} />

            {/* add previous semester button */}
            {!isScheduleIds && classYear && (
              <button
                type="button"
                className="h-full grow-0 bg-blue-secondary px-4 transition hover:bg-blue-primary"
                onClick={addPrevSemester}
                name="Add previous semester"
                title="Add previous semester"
              >
                <FaPlus />
              </button>
            )}

            <CourseCardStyleProvider defaultStyle="collapsed">
              {showColumns.map((column) => (
                <SemesterColumn
                  key={isScheduleIds ? column as string : semesterToTerm(column as Semester)}
                  s={column}
                  colWidth={colWidth}
                  highlightedRequirement={highlightedRequirement}
                />
              ))}
            </CourseCardStyleProvider>

            {/* when dragging, drag over this area to scroll right */}
            <div ref={rightScrollRef} />
          </div>
        </div>

        <DragObservers
          leftIntersecting={leftIntersecting}
          rightIntersecting={rightIntersecting}
          semestersContainerRef={semestersContainerRef}
        />
      </div>
    </DragAndDropProvider>
  );
}
