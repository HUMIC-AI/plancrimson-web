import Image from 'next/image';
import React, {
  DragEventHandler, Ref, forwardRef, useMemo,
} from 'react';
import {
  FaExclamationTriangle,
} from 'react-icons/fa';
import {
  ExtendedClass, departmentImages, getSemester, semesterToTerm,
} from '@/src/lib';
import { useModal } from '@/src/context/modal';
import { alertUnexpectedError, useAppSelector } from '@/src/utils/hooks';
import {
  Schedules,
} from '@/src/features';
import { classNames } from '@/src/utils/styles';
import { useExpandCards } from '@/src/context/expandCards';
import Tooltip from '../Utils/Tooltip';
import { ClassSizeRating, HoursRating, StarRating } from './RatingIndicators';
import { useDragAndDropContext } from '../YearSchedule/SemesterColumn/DragAndDrop';
import { CourseCardToggleButton } from './ToggleButton';
import { Highlight } from '../SearchComponents/Highlight';
import {
  Instructors, DaysOfWeek, Location, ClassTime,
} from './CourseComponents';

type Department = keyof typeof departmentImages;

// see below
type CourseCardProps = {
  course: ExtendedClass;
  chosenScheduleId?: string | null;
  highlight?: boolean;
  warnings?: string;
  hideTerm?: boolean;
  hideRatings?: boolean;
};

/**
 * Renders a given small expandable course card on the planning page or in the search page.
 * Should be *pure* and only use data from the provided course (and not reference the {@link ClassCache})
 * @param course the course to summarize in this card
 * @param chosenScheduleId the current chosen schedule. Used for various button interactions.
 * @param highlight whether to highlight this class. Used in the requirements checker. default false
 * @param warnings an optional list of warnings, eg time collisions with other classes
 */
export const CourseCard = forwardRef(({
  course,
  chosenScheduleId = null,
  highlight = false,
  warnings,
  hideTerm = false,
  hideRatings = false,
}: CourseCardProps, ref: Ref<HTMLDivElement>) => {
  const { expandCards } = useExpandCards();
  const chosenSchedule = useAppSelector(Schedules.selectSchedule(chosenScheduleId));
  const { showCourse } = useModal();
  const drag = useDragAndDropContext();

  const [semester, department] = useMemo(
    () => [
      getSemester(course),
      course.IS_SCL_DESCR_IS_SCL_DESCRD as Department,
    ],
    [course],
  );

  const onDragStart: DragEventHandler<unknown> | undefined = drag.enabled ? (ev) => {
    ev.dataTransfer.dropEffect = 'move';

    if (!chosenSchedule?.title) {
      alertUnexpectedError(new Error('Selected schedule has no ID'));
    } else {
      drag.setDragStatus({
        dragging: true,
        data: {
          classId: course.id,
          originScheduleId: chosenSchedule.id,
          originTerm: semesterToTerm(semester),
        },
      });
    }
  } : undefined;

  if (expandCards === 'text') {
    return (
      <div
        className="flex items-center justify-between"
        draggable={drag.enabled}
        onDragStart={onDragStart}
        ref={ref}
      >
        <button
          type="button"
          onClick={() => showCourse(course)}
          className="transition-opacity hover:opacity-50"
        >
          {course.SUBJECT + course.CATALOG_NBR}
        </button>

        <CourseCardToggleButton
          chosenScheduleId={chosenScheduleId!}
          course={course}
        />
      </div>
    );
  }

  const isExpanded = expandCards === 'expanded';

  return (
    // move the shadow outside to avoid it getting hidden
    <div className="overflow-hidden rounded-xl border border-gray-secondary shadow-xl" ref={ref}>
      <div
        className={classNames(
          'relative text-left h-full',
        )}
        draggable={drag.enabled}
        onDragStart={onDragStart}
      >
        {/* header component */}
        <div
          className={classNames(
            'p-2 from-gray-secondary via-secondary bg-gradient-to-br',
            isExpanded && (highlight ? 'to-blue-primary' : 'to-blue-secondary'),
            drag.enabled && 'cursor-move',
            isExpanded && 'relative',
          )}
        >
          {departmentImages[department] && (
          <Image
            src={departmentImages[department].urls.thumb}
            alt={departmentImages[department].alt_description || ''}
            fill
            sizes="240px"
            style={{ objectFit: 'cover' }}
            className={highlight ? 'opacity-10' : 'opacity-30'}
          />
          )}

          {/* relative so it appears above the image */}
          <div className="relative space-y-1">
            <p className="flex items-center justify-between">
              <button type="button" className="interactive border-b text-left font-bold text-blue-primary" onClick={() => showCourse(course)}>
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

                <CourseCardToggleButton
                  chosenScheduleId={chosenScheduleId!}
                  course={course}
                />
              </span>
            </p>

            <p className={classNames(isExpanded || 'text-sm', 'font-medium')}>
              <Highlight
                attribute="Title"
                hit={course}
              />
            </p>

            {hideTerm || (
            <p className="text-sm">
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
