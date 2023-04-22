import Image from 'next/image';
import React, { useMemo } from 'react';
import {
  FaTimes, FaPlus, FaExclamationTriangle,
} from 'react-icons/fa';
import {
  ExtendedClass,
  getClassId, departmentImages, getSemester,
} from 'plancrimson-utils';
import { checkViable } from '@/src/searchSchedule';
import { useModal } from '@/src/context/modal';
import { handleError, useAppDispatch, useAppSelector } from '@/src/hooks';
import {
  ClassCache, Planner, Profile, Schedules,
} from '@/src/features';
import { classNames } from '@/src/utils';
import Tooltip from '../Tooltip';
import {
  ClassTime,
  DaysOfWeek,
  HighlightComponent,
  Instructors,
  Location,
} from './CourseComponents';
import { ClassSizeRating, HoursRating, StarRating } from './RatingIndicators';

type Department = keyof typeof departmentImages;

export type DragStatus =
  | {
    dragging: false;
  }
  | {
    dragging: true;
    data: {
      classId: string;
      originScheduleId: string;
    };
  };

function ToggleButton({ chosenScheduleId, course } : { chosenScheduleId: string; course: ExtendedClass; }) {
  const dispatch = useAppDispatch();
  const chosenSchedule = useAppSelector(Schedules.selectSchedule(chosenScheduleId));
  const semesterFormat = useAppSelector(Planner.selectSemesterFormat);
  const classYear = useAppSelector(Profile.selectClassYear);
  const classCache = useAppSelector(ClassCache.selectClassCache);

  // adds a class to the selected schedule.
  // linked to plus button in top right corner.
  function addClass() {
    if (!chosenSchedule || !classYear) return;

    const viability = checkViable({
      cls: course,
      schedule: chosenSchedule,
      classCache,
      classYear,
    });
    if (viability.viability === 'No') {
      alert(viability.reason);
      return;
    }
    if (viability.viability === 'Unlikely') {
      // eslint-disable-next-line no-restricted-globals
      const yn = confirm(`${viability.reason} Continue anyways?`);
      if (!yn) return;
    }

    dispatch(Schedules.addCourses({
      courses: [{ classId: getClassId(course) }],
      scheduleId: chosenSchedule.id,
    }));
  }

  if (!chosenSchedule) return null;

  const inSchedule = chosenSchedule?.classes.find(({ classId }) => course.id === classId);

  if (semesterFormat === 'sample' || !inSchedule) {
    return (
      <button
        type="button"
        name="Add class to schedule"
        onClick={addClass}
        className="transition-opacity hover:opacity-50"
      >
        <FaPlus color="white" />
      </button>
    );
  }

  return (
    <button
      type="button"
      name="Remove class from schedule"
      onClick={() => dispatch(Schedules.removeCourses({
        courseIds: [getClassId(course)],
        scheduleId: chosenSchedule.id,
      }))}
      className="transition-opacity hover:opacity-50"
    >
      <FaTimes color="yellow" />
    </button>
  );
}

// see below
type CourseCardProps = {
  course: ExtendedClass;
  chosenScheduleId?: string | null;
  highlight?: boolean;
  inSearchContext?: boolean;
  setDragStatus?: React.Dispatch<React.SetStateAction<DragStatus>>;
  warnings?: string;
  hideTerm?: boolean;
  hideRatings?: boolean;
};

/**
 * Renders a given small expandable course card on the planning page or in the search page.
 * @param course the course to summarize in this card
 * @param chosenScheduleId the current chosen schedule. Used for various button interactions.
 * @param highlight whether to highlight this class. default false
 * @param setDragStatus a callback when this card starts to be dragged
 * @param warnings an optional list of warnings, eg time collisions with other classes
 */
export default function CourseCard({
  course,
  chosenScheduleId = null,
  highlight = false,
  setDragStatus,
  inSearchContext = true,
  warnings,
  hideTerm = false,
  hideRatings = false,
}: CourseCardProps) {
  const cardExpandStyle = useAppSelector(Planner.selectExpandCards);
  const chosenSchedule = useAppSelector(Schedules.selectSchedule(chosenScheduleId));
  const { showCourse } = useModal();

  const draggable = typeof setDragStatus !== 'undefined';
  const [semester, department] = useMemo(
    () => [
      getSemester(course),
      course.IS_SCL_DESCR_IS_SCL_DESCRD as Department,
    ],
    [course],
  );

  const handleDragStart: React.DragEventHandler<HTMLDivElement> = (ev) => {
    // eslint-disable-next-line no-param-reassign
    ev.dataTransfer.dropEffect = 'move';
    // eslint-disable-next-line no-alert
    if (!chosenSchedule?.title) {
      handleError(new Error('Selected schedule has no ID'));
    } else {
      setDragStatus!({
        dragging: true,
        data: {
          classId: getClassId(course),
          originScheduleId: chosenSchedule.id,
        },
      });
    }
  };

  if (cardExpandStyle === 'text') {
    return (
      <span onDragStart={draggable ? handleDragStart : undefined}>
        <button
          type="button"
          draggable={draggable}
          onClick={() => showCourse(course)}
          className="transition-opacity hover:opacity-50"
        >
          {course.SUBJECT + course.CATALOG_NBR}
        </button>
      </span>
    );
  }

  const isExpanded = cardExpandStyle === 'expanded';

  return (
    // move the shadow outside to avoid it getting hidden
    <div className="overflow-hidden rounded-xl shadow-xl">
      <div
        className={classNames(
          'relative from-black text-left h-full',
          isExpanded || 'bg-gradient-to-br',
          isExpanded || (highlight ? 'to-blue-light' : 'to-primary-dark'),
        )}
        draggable={draggable}
        onDragStart={draggable ? handleDragStart : undefined}
      >
        {/* header component */}
        <div
          className={classNames(
            'p-2 text-white from-black via-black bg-gradient-to-br',
            isExpanded && (highlight ? 'to-blue-light' : 'to-primary-dark'),
            draggable && 'cursor-move',
            isExpanded && 'relative',
          )}
        >
          {departmentImages[department] && (
          <Image
            src={departmentImages[department].urls.thumb}
            alt={departmentImages[department].alt_description || ''}
            fill
            style={{ objectFit: 'cover' }}
            className={highlight ? 'opacity-10' : 'opacity-30'}
          />
          )}

          {/* relative so it appears above the image */}
          <div className="relative space-y-1">
            <p className="flex items-center justify-between">
              <button type="button" className="interactive border-b text-left font-bold text-blue-light" onClick={() => showCourse(course)}>
                <HighlightComponent
                  attribute="SUBJECT"
                  course={course}
                  inSearch={inSearchContext}
                />
                <HighlightComponent
                  attribute="CATALOG_NBR"
                  course={course}
                  inSearch={inSearchContext}
                />
              </button>

              {/* the info and course selection buttons */}
              <span className="ml-2 flex items-center space-x-2">
                {warnings && (
                <Tooltip text={warnings} direction="bottom">
                  <FaExclamationTriangle color="yellow" className="text-xl" />
                </Tooltip>
                )}

                <ToggleButton chosenScheduleId={chosenScheduleId!} course={course} />
              </span>
            </p>

            <p className={classNames(isExpanded || 'text-sm')}>
              <HighlightComponent
                attribute="Title"
                course={course}
                inSearch={inSearchContext}
              />
            </p>

            {hideTerm || (
            <p className="text-sm text-gray-light">
              {semester.season}
              {' '}
              {semester.year}
            </p>
            )}

            {!hideRatings && (
            <>
              {typeof course.meanRating !== 'undefined' && <StarRating rating={course.meanRating} />}
              {typeof course.meanClassSize !== 'undefined' && <ClassSizeRating population={course.meanClassSize} />}
              {typeof course.meanHours !== 'undefined' && <HoursRating hours={course.meanHours} />}
            </>
            )}
          </div>
        </div>
        {/* end header component */}

        {isExpanded && (
        <div className="h-full bg-white p-2 text-black">
          <div className="inline-grid max-w-full grid-cols-[auto_1fr] items-center gap-x-4 gap-y-2 text-sm">
            <Instructors course={course} inSearch={inSearchContext} />
            <Location course={course} inSearch={inSearchContext} />
            <DaysOfWeek course={course} inSearch={inSearchContext} />
            <ClassTime course={course} inSearch={inSearchContext} />
          </div>

          {course.textDescription.length > 0 && (
          <>
            <hr className="my-2 border-black" />
            <p className="line-clamp-3 text-sm">
              <HighlightComponent
                attribute="textDescription"
                course={course}
                inSearch={inSearchContext}
              />
            </p>
          </>
          )}
        </div>
        )}
      </div>
    </div>
  );
}
