import Image from 'next/image';
import React, {
  DragEventHandler, Ref, forwardRef, useMemo, useCallback, useState,
} from 'react';
import {
  FaExclamationTriangle,
} from 'react-icons/fa';
import {
  ExtendedClass, Semester, departmentImages, getSemester, semesterToTerm,
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
import { useChosenSchedule } from '../../src/context/ScheduleProvider';
import { Schedules } from '../../src/features';
import { getClassIdsOfSchedule } from '../../src/features/schedules';

type Department = keyof typeof departmentImages;

type CourseCardProps = {
  course: ExtendedClass;
  highlight?: boolean;
  warnings?: string;
  hideTerm?: boolean;
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
  highlight = false,
  warnings,
  hideTerm = false,
}: CourseCardProps, ref: Ref<HTMLDivElement>) => {
  const {
    style, clickWholeCard, disableClick, hover,
  } = useCourseCardStyle();
  const [isHovered, setIsHovered] = useState(false);
  const { schedule } = useChosenSchedule();
  const drag = useCourseDragContext();
  const isInSchedule = getClassIdsOfSchedule(schedule).includes(course.id);
  const handleClickTitle = useHandleClickTitle(clickWholeCard, isInSchedule);

  const [semester, department] = useMemo(
    () => [
      getSemester(course),
      course.IS_SCL_DESCR_IS_SCL_DESCRD as Department,
    ],
    [course],
  );

  const onDragStart: DragEventHandler<unknown> | undefined = useMemo(() => (drag ? (ev) => {
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
  } : undefined), [course.id, drag, schedule, semester]);


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
          onClick={() => handleClickTitle(course)}
          className="transition-opacity hover:opacity-50"
        >
          {course.SUBJECT + course.CATALOG_NBR}
        </button>

        {!clickWholeCard && <CourseCardToggleButton course={course} />}
      </div>
    );
  }

  const isExpanded = style === 'expanded';

  const containerStyles = classNames(
    'p-2 from-gray-secondary via-secondary bg-gradient-to-br text-left',
    isExpanded && (highlight ? 'to-blue-primary' : 'to-blue-secondary'),
    drag && 'cursor-move',
    isExpanded && 'relative',
  );

  const Header = (
    <CourseCardHeader
      highlight={highlight}
      department={department}
      course={course}
      warnings={warnings}
      hideTerm={hideTerm}
      semester={semester}
      handleClickTitle={handleClickTitle}
    />
  );

  const onHover = () => {
    if (hover?.filter(course)) {
      hover.onHover(course);
      setIsHovered(true);
    }
  };

  return (
    // move the shadow outside to avoid it getting hidden
    <div
      className={classNames(
        'overflow-hidden rounded-xl border-gray-secondary border transition',
        style === 'expanded' && 'shadow-xl',
        style === 'collapsed' && 'shadow-md',
        // don't use "hover.filter" and "hover:" for performance
        hover && isInSchedule && (isHovered ? 'ring-4 ring-primary' : 'ring-blue-primary ring-2'),
      )}
      draggable={drag !== null}
      onDragStart={onDragStart}
      onMouseOver={onHover}
      onMouseOut={() => setIsHovered(false)}
      onFocus={onHover}
      onBlur={() => setIsHovered(false)}
      ref={ref}
    >
      <div className="relative h-full text-left">
        {clickWholeCard
          ? (
            <button
              type="button"
              onClick={disableClick ? undefined : () => handleClickTitle(course)}
              className={classNames(containerStyles, disableClick && 'cursor-not-allowed')}
            >
              {Header}
            </button>
          )
          : (
            <div className={containerStyles}>
              {Header}
            </div>
          )}

        {isExpanded && <CourseCardDetails course={course} />}
      </div>
    </div>
  );
});

function CourseCardDetails({ course }: { course: ExtendedClass }) {
  return (
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
  );
}

function CourseCardHeader({
  highlight, department, course, warnings, hideTerm, semester, handleClickTitle,
}: {
  highlight: boolean;
  department: Department;
  course: ExtendedClass;
  warnings: string | undefined;
  hideTerm: boolean;
  semester: Semester;
  handleClickTitle: (course: ExtendedClass) => void;
}) {
  const { style, clickWholeCard } = useCourseCardStyle();
  const isExpanded = style === 'expanded';

  const Title = (
    <>
      <Highlight
        attribute="SUBJECT"
        hit={course}
      />
      <Highlight
        attribute="CATALOG_NBR"
        hit={course}
      />
    </>
  );

  return (
    <>
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
        <div className="flex items-start justify-between">
          {clickWholeCard ? (
            <p className="font-bold">
              {Title}
            </p>
          ) : (
            <button
              type="button"
              onClick={() => handleClickTitle(course)}
              className="interactive border-b text-left font-bold text-blue-primary"
            >
              {Title}
            </button>
          )}

          {/* the info and course selection buttons */}
          <span className="ml-2 flex items-center space-x-2">
            {warnings && (
            <Tooltip text={warnings} direction="bottom">
              <FaExclamationTriangle className="text-xl text-orange" />
            </Tooltip>
            )}

            {!clickWholeCard && <CourseCardToggleButton course={course} />}
          </span>
        </div>

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

        {isExpanded && (
        <>
          {typeof course.meanRating === 'number' && <StarRating rating={course.meanRating} />}
          {typeof course.meanClassSize === 'number' && <ClassSizeRating population={course.meanClassSize} />}
          {typeof course.meanHours === 'number' && <HoursRating hours={course.meanHours} />}
        </>
        )}
      </div>
    </>
  );
}

function useHandleClickTitle(clickWholeCard: boolean, isInSchedule: boolean) {
  const dispatch = useAppDispatch();
  const { showCourse } = useModal();
  const { id: scheduleId } = useChosenSchedule();

  const handleClick = useCallback((course: ExtendedClass) => {
    if (clickWholeCard) {
      if (scheduleId) {
        if (isInSchedule) {
          dispatch(Schedules.removeCourses({
            scheduleId,
            courseIds: [course.id],
          }));
        } else {
          dispatch(Schedules.addCourses({
            scheduleId,
            courseIds: [course.id],
          }));
        }
      }
    } else {
      showCourse(course);
    }
  }, [clickWholeCard, isInSchedule, dispatch, scheduleId, showCourse]);

  return handleClick;
}
