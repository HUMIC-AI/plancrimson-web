import Image from 'next/image';
import React, {
  DragEventHandler, Ref, forwardRef, useMemo, useCallback,
} from 'react';
import {
  FaExclamationTriangle,
} from 'react-icons/fa';
import {
  ExtendedClass, departmentImages, getSemester, semesterToTerm,
} from '@/src/lib';
import { useModal } from '@/src/context/modal';
import { alertUnexpectedError, useAppDispatch } from '@/src/utils/hooks';
import { classNames } from '@/src/utils/styles';
import { useCourseCardStyle } from '@/src/context/CourseCardStyleProvider';
import Tooltip from '../Utils/Tooltip';
import { ClassSizeRating, HoursRating, StarRating } from './RatingIndicators';
import { useCourseDragContext } from '../../src/context/DragCourseMoveSchedulesProvider';
import { CourseCardToggleButton } from './ToggleButton';
import { Highlight } from '../SearchComponents/Highlight';
import {
  Instructors, DaysOfWeek, Location, ClassTime,
} from './CourseComponents';
import { useChosenSchedule } from '../../src/context/selectedSchedule';
import { Schedules } from '../../src/features';

type Department = keyof typeof departmentImages;

type CourseCardProps = {
  course: ExtendedClass;
  addViaTitleClick?: boolean;
  highlight?: boolean;
  warnings?: string;
  hideTerm?: boolean;
  hideRatings?: boolean;
};

/**
 * Renders a given small expandable course card on the planning page or in the search page.
 * Should be *pure* and only use data from the provided course (and not reference the {@link ClassCache})
 * @param course the course to summarize in this card
 * @param addViaTitleClick whether to hide the toggle button. default false
 * @param highlight whether to highlight this class. Used in the requirements checker. default false
 * @param warnings an optional warning, eg time collisions with other classes
 * @param hideTerm whether to hide the term (semester and year) of the course. default false
 * @param hideRatings whether to hide the ratings of the course. default false
 */
export const CourseCard = forwardRef(({
  course,
  addViaTitleClick = false,
  highlight = false,
  warnings,
  hideTerm = false,
  hideRatings = false,
}: CourseCardProps, ref: Ref<HTMLDivElement>) => {
  const { style } = useCourseCardStyle();
  const { schedule } = useChosenSchedule();
  const drag = useCourseDragContext();
  const handleClickTitle = useHandleClickTitle(addViaTitleClick, course);

  const [semester, department] = useMemo(
    () => [
      getSemester(course),
      course.IS_SCL_DESCR_IS_SCL_DESCRD as Department,
    ],
    [course],
  );

  const onDragStart: DragEventHandler<unknown> | undefined = drag ? (ev) => {
    ev.dataTransfer.dropEffect = 'move';

    if (!schedule?.title) {
      alertUnexpectedError(new Error('Selected schedule has no ID'));
    } else {
      drag?.setDragStatus({
        dragging: true,
        data: {
          classId: course.id,
          originScheduleId: schedule.id,
          originTerm: semesterToTerm(semester),
        },
      });
    }
  } : undefined;

  if (style === 'text') {
    return (
      <div
        className="flex items-center justify-between"
        draggable={drag !== null}
        onDragStart={onDragStart}
        ref={ref}
      >
        <button
          type="button"
          onClick={handleClickTitle}
          className="transition-opacity hover:opacity-50"
        >
          {course.SUBJECT + course.CATALOG_NBR}
        </button>

        {!addViaTitleClick && <CourseCardToggleButton course={course} />}
      </div>
    );
  }

  const isExpanded = style === 'expanded';

  return (
    // move the shadow outside to avoid it getting hidden
    <div
      className={classNames(
        'overflow-hidden rounded-xl border border-gray-secondary',
        style === 'expanded' && 'shadow-xl',
        style === 'collapsed' && 'shadow-md',
      )}
      ref={ref}
    >
      <div
        className={classNames(
          'relative text-left h-full',
        )}
        draggable={drag !== null}
        onDragStart={onDragStart}
      >
        {/* header component */}
        <div
          className={classNames(
            'p-2 from-gray-secondary via-secondary bg-gradient-to-br',
            isExpanded && (highlight ? 'to-blue-primary' : 'to-blue-secondary'),
            drag && 'cursor-move',
            isExpanded && 'relative',
          )}
        >
          {departmentImages[department] && (
          <Image
            src={departmentImages[department].urls.thumb}
            alt={departmentImages[department].alt_description || ''}
            fill
            sizes="200px"
            style={{ objectFit: 'cover' }}
            className={highlight ? 'opacity-10' : 'opacity-30'}
          />
          )}

          {/* relative so it appears above the image */}
          <div className="relative space-y-1">
            <p className="flex items-center justify-between">
              <button
                type="button"
                className="interactive border-b text-left font-bold text-blue-primary"
                onClick={handleClickTitle}
              >
                <Highlight
                  attribute="SUBJECT"
                  hit={course}
                />
                <Highlight
                  attribute="CATALOG_NBR"
                  hit={course}
                />
              </button>

              {/* the info and course selection buttons */}
              <span className="ml-2 flex items-center space-x-2">
                {warnings && (
                <Tooltip text={warnings} direction="bottom">
                  <FaExclamationTriangle className="text-xl text-orange" />
                </Tooltip>
                )}

                {!addViaTitleClick && <CourseCardToggleButton course={course} />}
              </span>
            </p>

            <p className={classNames(!isExpanded && 'text-sm', 'font-medium')}>
              <Highlight
                attribute="Title"
                hit={course}
              />
            </p>

            {hideTerm || (
            <p className={classNames(isExpanded && 'text-sm')}>
              {semester.season}
              {' '}
              {semester.year}
            </p>
            )}

            {!hideRatings && (
            <>
              {typeof course.meanRating === 'number' && <StarRating rating={course.meanRating} />}
              {typeof course.meanClassSize === 'number' && <ClassSizeRating population={course.meanClassSize} />}
              {typeof course.meanHours === 'number' && <HoursRating hours={course.meanHours} />}
            </>
            )}
          </div>
        </div>
        {/* end header component */}

        {isExpanded && (
        <div className="h-full bg-secondary p-2">
          <div className="inline-grid max-w-full grid-cols-[auto_1fr] items-center gap-x-4 gap-y-2 text-sm">
            <Instructors course={course} />
            <Location course={course} />
            <DaysOfWeek course={course} />
            <ClassTime course={course} />
          </div>

          {course.textDescription.length > 0 && (
          <>
            <hr className="my-2 border-black" />
            <p className="line-clamp-3 text-sm">
              <Highlight
                attribute="textDescription"
                hit={course}
              />
            </p>
          </>
          )}
        </div>
        )}
      </div>
    </div>
  );
});

function useHandleClickTitle(addViaTitleClick: boolean, course: ExtendedClass) {
  const dispatch = useAppDispatch();
  const { showCourse } = useModal();
  const { id: scheduleId } = useChosenSchedule();

  const handleClick = useCallback(() => {
    if (addViaTitleClick) {
      dispatch(Schedules.addCourses({
        courseIds: [course.id],
        scheduleId,
      }));
    } else {
      showCourse(course);
    }
  }, [course, dispatch, addViaTitleClick, scheduleId, showCourse]);

  return handleClick;
}
