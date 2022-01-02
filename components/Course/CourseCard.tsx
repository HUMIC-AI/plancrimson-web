import React from 'react';
import { FaInfo, FaTimes, FaPlus } from 'react-icons/fa';
import { ExtendedClass } from '../../shared/apiTypes';
import { Schedule } from '../../shared/firestoreTypes';
import { getClassId, classNames } from '../../shared/util';
import useCardStyle from '../../src/context/cardStyle';
import useUserData from '../../src/context/userData';
import {
  ClassTime, DaysOfWeek, HighlightComponent, Instructors, Location,
} from './CourseComponents';

type Props = {
  course: ExtendedClass;
  selectedSchedule: Schedule | null;
  handleExpand: (course: ExtendedClass) => void;
  highlight?: boolean;
  inSearchContext?: boolean;
  setDragStatus?: React.Dispatch<React.SetStateAction<DragStatus>>;
};

export type DragStatus = {
  dragging: false;
} | {
  dragging: true;
  data: {
    classId: string;
    originScheduleId: string;
  };
};

const CourseCard: React.FC<Props> = function ({
  course, selectedSchedule, handleExpand, highlight, setDragStatus, inSearchContext = true,
}) {
  const { addCourses, removeCourses } = useUserData();
  const { isExpanded } = useCardStyle();
  const draggable = typeof setDragStatus !== 'undefined';

  return (
    // move the shadow outside to avoid it getting hidden
    <div className="shadow-lg">
      <div
        className="rounded-xl overflow-hidden border-gray-800 bg-gray-800 border-4 text-left h-full"
        draggable={draggable}
        onDragStart={draggable ? (ev) => {
          // eslint-disable-next-line no-param-reassign
          ev.dataTransfer.dropEffect = 'move';
          // eslint-disable-next-line no-alert
          if (!selectedSchedule?.id) alert('Oops! An unexpected error occurred.');
          else {
            setDragStatus({
              dragging: true,
              data: { classId: getClassId(course), originScheduleId: selectedSchedule.id },
            });
          }
        } : undefined}
      >
        <div className={classNames(
          highlight ? 'bg-blue-500' : 'bg-gray-800',
          'p-2 text-white',
          draggable && 'cursor-move',
        )}
        >
          <p className="flex justify-between items-start">
            <span className="font-bold text-blue-300">
              <HighlightComponent attribute="SUBJECT" course={course} inSearch={inSearchContext} />
              <HighlightComponent attribute="CATALOG_NBR" course={course} inSearch={inSearchContext} />
            </span>
            <span className="flex items-center gap-2 ml-2">
              <button
                type="button"
                className="bg-black bg-opacity-0 hover:bg-opacity-50 transition-colors rounded p-1"
                onClick={() => handleExpand(course)}
              >
                <FaInfo />
              </button>
              {selectedSchedule && (
                selectedSchedule.classes.find((cls) => cls.classId === getClassId(course))
                  ? (
                    <button
                      type="button"
                      onClick={() => removeCourses({
                        classId: getClassId(course),
                        scheduleId: selectedSchedule.id,
                      })}
                    >
                      <FaTimes />
                    </button>
                  )
                  : (
                    <button
                      type="button"
                      onClick={() => addCourses({
                        classId: getClassId(course),
                        scheduleId: selectedSchedule.id,
                      })}
                    >
                      <FaPlus />
                    </button>
                  ))}
            </span>
          </p>
          <h3 className={classNames(isExpanded || 'text-sm')}>
            <HighlightComponent attribute="Title" course={course} inSearch={inSearchContext} />
          </h3>
        </div>

        {isExpanded && (
        <div className="p-2 bg-white h-full">
          <div className="inline-grid grid-cols-[auto_1fr] items-center gap-y-2 gap-x-4">
            <Instructors course={course} inSearch={inSearchContext} />
            <Location course={course} inSearch={inSearchContext} />
            <DaysOfWeek course={course} inSearch={inSearchContext} />
            <ClassTime course={course} inSearch={inSearchContext} />
          </div>
          {course.textDescription.length > 0 && (
          <>
            <hr className="border-black my-2" />
            <p className="text-sm line-clamp-3">
              <HighlightComponent attribute="textDescription" course={course} inSearch={inSearchContext} />
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
