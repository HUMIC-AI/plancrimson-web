import Image from 'next/image';
import React, { useCallback, useMemo } from 'react';
import { FaInfo, FaTimes, FaPlus } from 'react-icons/fa';
import { ExtendedClass } from '../../shared/apiTypes';
import { Schedule } from '../../shared/firestoreTypes';
import {
  getClassId,
  classNames,
  getSemester,
  checkViable,
} from '../../shared/util';
import useCardStyle from '../../src/context/cardStyle';
import useClassCache from '../../src/context/classCache';
import useShowAllSchedules from '../../src/context/showAllSchedules';
import useUserData from '../../src/context/userData';
import {
  ClassTime,
  DaysOfWeek,
  HighlightComponent,
  Instructors,
  Location,
} from './CourseComponents';
import departmentImages from './departmentImages.json';

type Props = {
  course: ExtendedClass;
  selectedSchedule: Schedule | null;
  handleExpand: (course: ExtendedClass) => void;
  highlight?: boolean;
  inSearchContext?: boolean;
  setDragStatus?: React.Dispatch<React.SetStateAction<DragStatus>>;
};

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

const CourseCard: React.FC<Props> = function ({
  course,
  selectedSchedule,
  handleExpand,
  highlight,
  setDragStatus,
  inSearchContext = true,
}) {
  const { data: userData, addCourses, removeCourses } = useUserData();
  const classCache = useClassCache(Object.values(userData.schedules));
  const { isExpanded } = useCardStyle();
  const { showAllSchedules } = useShowAllSchedules();
  const draggable = typeof setDragStatus !== 'undefined';
  const [semester, department] = useMemo(
    () => [
      getSemester(course),
      course.IS_SCL_DESCR_IS_SCL_DESCRD as Department,
    ],
    [course],
  );

  const buttonStyles = 'bg-black bg-opacity-0 hover:bg-opacity-50 transition-colors rounded p-1';

  const addClass = useCallback(() => {
    if (!selectedSchedule) return;
    const viability = checkViable(
      course,
      {
        year: selectedSchedule.year,
        season: selectedSchedule.season,
      },
      userData,
      classCache,
    );
    if (viability.viability === 'No') {
      alert(viability.reason);
      return;
    }
    if (viability.viability === 'Unlikely') {
      // eslint-disable-next-line no-restricted-globals
      const yn = confirm(`${viability.reason} Continue anyways?`);
      if (!yn) return;
    }
    addCourses({
      classId: getClassId(course),
      scheduleId: selectedSchedule.id,
    });
  }, [addCourses, classCache, course, selectedSchedule, userData]);

  const handleDragStart: React.DragEventHandler<HTMLDivElement> = (ev) => {
    // eslint-disable-next-line no-param-reassign
    ev.dataTransfer.dropEffect = 'move';
    // eslint-disable-next-line no-alert
    if (!selectedSchedule?.id) {
      alert('Oops! An unexpected error occurred.');
    } else {
      setDragStatus!({
        dragging: true,
        data: {
          classId: getClassId(course),
          originScheduleId: selectedSchedule.id,
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
                <button
                  type="button"
                  name="More info"
                  className={buttonStyles}
                  onClick={() => handleExpand(course)}
                >
                  <FaInfo />
                </button>

                {selectedSchedule
                  && showAllSchedules !== 'sample'
                  && (selectedSchedule.classes.find(
                    (cls) => cls.classId === getClassId(course),
                  ) ? (
                    <button
                      type="button"
                      name="Remove class from schedule"
                      onClick={() => removeCourses({
                        classId: getClassId(course),
                        scheduleId: selectedSchedule.id,
                      })}
                      className={buttonStyles}
                    >
                      <FaTimes />
                    </button>
                    ) : (
                      <button
                        type="button"
                        name="Add class to schedule"
                        onClick={addClass}
                        className={buttonStyles}
                      >
                        <FaPlus />
                      </button>
                    ))}
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
};

export default CourseCard;
