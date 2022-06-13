import Image from 'next/image';
import React, { useMemo } from 'react';
import {
  FaInfo, FaTimes, FaPlus, FaExclamationTriangle,
} from 'react-icons/fa';
import { ExtendedClass } from '../../shared/apiTypes';
import {
  getClassId,
  classNames,
  getSemester,
  checkViable,
} from '../../shared/util';
import { handleError, useAppDispatch, useAppSelector } from '../../src/hooks';
import Tooltip from '../Tooltip';
import {
  ClassTime,
  DaysOfWeek,
  HighlightComponent,
  Instructors,
  Location,
} from './CourseComponents';
import departmentImages from '../../shared/assets/departmentImages.json';
import {
  ClassCache, Planner, Profile, Schedules,
} from '../../src/features';

const buttonStyles = 'bg-white text-blue-900 bg-opacity-60 hover:bg-opacity-90 transition-colors rounded-full p-1';

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
        className={buttonStyles}
      >
        <FaPlus />
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
      className={buttonStyles}
    >
      <FaTimes />
    </button>
  );
}

// see below
type CourseCardProps = {
  course: ExtendedClass;
  chosenScheduleId: string | null;
  handleExpand: (course: ExtendedClass) => void;
  highlight?: boolean;
  inSearchContext?: boolean;
  setDragStatus?: React.Dispatch<React.SetStateAction<DragStatus>>;
  warnings?: string;
  interactive?: boolean;
};

/**
 * Renders a given small expandable course card on the planning page or in the search page.
 * @param course the course to summarize in this card
 * @param chosenScheduleId the current chosen schedule. Used for various button interactions.
 * @param handleExpand the callback to expand the card
 * @param highlight whether to highlight this class. default false
 * @param setDragStatus a callback when this card starts to be dragged
 * @param warnings an optional list of warnings, eg time collisions with other classes
 */
export default function CourseCard({
  course,
  chosenScheduleId,
  handleExpand,
  highlight = false,
  setDragStatus,
  inSearchContext = true,
  warnings,
  interactive = true,
}: CourseCardProps) {
  const isExpanded = useAppSelector(Planner.selectExpandCards);
  const chosenSchedule = useAppSelector(Schedules.selectSchedule(chosenScheduleId));

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

  return (
    // move the shadow outside to avoid it getting hidden
    <div className="shadow-lg">
      <div
        className={classNames(
          'relative rounded-xl overflow-hidden border-gray-800 from-gray-800 border-4 text-left h-full',
          isExpanded ? 'bg-gray-800' : 'bg-gradient-to-br',
          isExpanded || (highlight ? 'to-blue-500' : 'to-blue-900'),
        )}
        draggable={draggable}
        onDragStart={draggable ? handleDragStart : undefined}
      >
        {/* header component */}
        <div
          className={classNames(
            'p-2 text-white from-black via-gray-800 bg-gradient-to-br',
            isExpanded && (highlight ? 'to-blue-500' : 'to-blue-900'),
            draggable && 'cursor-move',
            isExpanded && 'relative',
          )}
        >
          {departmentImages[department] && (
            <Image
              src={departmentImages[department].urls.thumb}
              alt={departmentImages[department].alt_description || undefined}
              layout="fill"
              objectFit="cover"
              className={highlight ? 'opacity-10' : 'opacity-30'}
            />
          )}
          <div className="relative">
            <p className="flex justify-between items-start">
              <span className="font-bold text-blue-300">
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
              </span>

              {/* the info and course selection buttons */}
              <span className="flex items-center space-x-2 ml-2">
                {warnings && (
                <Tooltip text={warnings} direction="bottom">
                  <FaExclamationTriangle color="yellow" className="text-xl" />
                </Tooltip>
                )}

                <button
                  type="button"
                  name="More info"
                  className={buttonStyles}
                  onClick={() => handleExpand(course)}
                >
                  <FaInfo />
                </button>

                {interactive && <ToggleButton chosenScheduleId={chosenScheduleId!} course={course} />}
              </span>
            </p>
            <h3 className={classNames(isExpanded || 'text-sm')}>
              <HighlightComponent
                attribute="Title"
                course={course}
                inSearch={inSearchContext}
              />
            </h3>
            <p className="text-sm text-gray-300">
              {semester.season}
              {' '}
              {semester.year}
            </p>
          </div>
        </div>
        {/* end header component */}

        {isExpanded && (
          <div className="p-2 bg-white h-full">
            <div className="inline-grid grid-cols-[auto_1fr] max-w-full items-center gap-y-2 gap-x-4">
              <Instructors course={course} inSearch={inSearchContext} />
              <Location course={course} inSearch={inSearchContext} />
              <DaysOfWeek course={course} inSearch={inSearchContext} />
              <ClassTime course={course} inSearch={inSearchContext} />
            </div>
            {course.textDescription.length > 0 && (
              <>
                <hr className="border-black my-2" />
                <p className="text-sm line-clamp-3">
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
