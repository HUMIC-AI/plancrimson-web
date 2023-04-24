import Image from 'next/image';
import React, { DragEventHandler, useMemo } from 'react';
import {
  FaTimes, FaPlus, FaExclamationTriangle,
} from 'react-icons/fa';
import {
  ExtendedClass,
  getClassId, departmentImages, getSemester,
} from 'plancrimson-utils';
import { checkViable } from '@/src/searchSchedule';
import { useModal } from '@/src/context/modal';
import { alertUnexpectedError, useAppDispatch, useAppSelector } from '@/src/utils/hooks';
import {
  ClassCache, Planner, Profile, Schedules,
} from '@/src/features';
import { classNames } from '@/src/utils/styles';
import Tooltip from '../Utils/Tooltip';
import {
  ClassTime,
  DaysOfWeek,
  HighlightComponent,
  Instructors,
  Location,
} from './CourseComponents';
import { ClassSizeRating, HoursRating, StarRating } from './RatingIndicators';
import { useDragAndDropContext } from '../YearSchedule/SemesterColumn/DragAndDrop';

type Department = keyof typeof departmentImages;

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
      <FaTimes className="text-yellow" />
    </button>
  );
}

// see below
type CourseCardProps = {
  course: ExtendedClass;
  chosenScheduleId?: string | null;
  highlight?: boolean;
  inSearchContext?: boolean;
  warnings?: string;
  hideTerm?: boolean;
  hideRatings?: boolean;
};

/**
 * Renders a given small expandable course card on the planning page or in the search page.
 * @param course the course to summarize in this card
 * @param chosenScheduleId the current chosen schedule. Used for various button interactions.
 * @param highlight whether to highlight this class. default false
 * @param warnings an optional list of warnings, eg time collisions with other classes
 */
export default function CourseCard({
  course,
  chosenScheduleId = null,
  highlight = false,
  inSearchContext = true,
  warnings,
  hideTerm = false,
  hideRatings = false,
}: CourseCardProps) {
  const cardExpandStyle = useAppSelector(Planner.selectExpandCards);
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
          classId: getClassId(course),
          originScheduleId: chosenSchedule.id,
        },
      });
    }
  } : undefined;

  if (cardExpandStyle === 'text') {
    return (
      <button
        type="button"
        onClick={() => showCourse(course)}
        className="transition-opacity hover:opacity-50"
        draggable={drag.enabled}
        onDragStart={onDragStart}
      >
        {course.SUBJECT + course.CATALOG_NBR}
      </button>
    );
  }

  const isExpanded = cardExpandStyle === 'expanded';

  return (
    // move the shadow outside to avoid it getting hidden
    <div className="overflow-hidden rounded-xl border border-gray-light shadow-xl">
      <div
        className={classNames(
          'relative from-black text-left h-full',
          isExpanded || 'bg-gradient-to-br',
          isExpanded || (highlight ? 'to-blue-light' : 'to-primary-dark'),
        )}
        draggable={drag.enabled}
        onDragStart={onDragStart}
      >
        {/* header component */}
        <div
          className={classNames(
            'p-2 text-white from-black via-black bg-gradient-to-br',
            isExpanded && (highlight ? 'to-blue-light' : 'to-primary-dark'),
            drag.enabled && 'cursor-move',
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
                  <FaExclamationTriangle className="text-xl text-orange" />
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
              {typeof course.meanRating === 'number' && <StarRating rating={course.meanRating} />}
              {typeof course.meanClassSize === 'number' && <ClassSizeRating population={course.meanClassSize} />}
              {typeof course.meanHours === 'number' && <HoursRating hours={course.meanHours} />}
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
