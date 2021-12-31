import React from 'react';
import {
  FaInfo, FaTimes, FaPlus, FaUser, FaMapMarkerAlt, FaClock, FaCalendarDay,
} from 'react-icons/fa';
import {
  DAYS_OF_WEEK, DAY_TO_KEY, DAY_TO_LETTER, ExtendedClass,
} from '../../shared/apiTypes';
import { Schedule } from '../../shared/firestoreTypes';
import { getClassId, classNames } from '../../shared/util';
import useUserData from '../../src/context/userData';
import Highlight from '../SearchComponents/Highlight';

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

const MockHighlight: React.FC<{ attribute: keyof ExtendedClass; hit: ExtendedClass }> = function ({ attribute, hit }) {
  return <span>{hit[attribute]}</span>;
};

const CourseCard: React.FC<Props> = function ({
  course, selectedSchedule, handleExpand, highlight, setDragStatus, inSearchContext = true,
}) {
  const { addCourses, removeCourses } = useUserData();
  const draggable = typeof setDragStatus !== 'undefined';

  const HighlightComponent = inSearchContext ? Highlight : MockHighlight;

  return (
    <div
      className="rounded-xl shadow overflow-hidden border-gray-800 border-4"
      draggable={draggable}
      onDragStart={draggable ? (ev) => {
      // eslint-disable-next-line no-param-reassign
        ev.dataTransfer.dropEffect = 'move';
        if (!selectedSchedule?.id) alert('Oops! An unexpected error occurred.');
        else {
          setDragStatus({
            dragging: true,
            data: { classId: getClassId(course), originScheduleId: selectedSchedule.id },
          });
        }
      } : undefined}
    >
      <div className={classNames(highlight ? 'bg-blue-500' : 'bg-gray-800', 'p-2 text-white')}>
        <p className="flex justify-between items-start">
          <span className="font-bold text-left text-blue-300">
            <HighlightComponent attribute="SUBJECT" hit={course} />
            <HighlightComponent attribute="CATALOG_NBR" hit={course} />
          </span>
          <span className="flex items-center gap-2 ml-2">
            <button type="button" className="bg-black bg-opacity-0 hover:bg-opacity-50 transition-colors rounded p-1" onClick={() => handleExpand(course)}>
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
        <h3>
          <HighlightComponent attribute="Title" hit={course} />
        </h3>
      </div>
      <div className="p-2">
        <div className="inline-grid grid-cols-[auto_1fr] items-center gap-y-2 gap-x-4">
          <FaUser />
          <span>{course.IS_SCL_DESCR_IS_SCL_DESCRL || 'Unknown'}</span>
          <FaMapMarkerAlt />
          {course.SUBJECT.startsWith('MIT') ? <span>MIT</span> : <HighlightComponent attribute="LOCATION_DESCR_LOCATION" hit={course} />}
          <FaCalendarDay />
          {course.IS_SCL_MEETING_PAT === 'TBA'
            ? <span>TBA</span>
            : (
              <>
                <div className="grid grid-cols-7 border border-black rounded overflow-hidden">
                  {DAYS_OF_WEEK.map((day) => (
                    <span
                      key={day}
                      className={classNames(
                        course[DAY_TO_KEY[day]] === 'Y' ? 'bg-gray-700 text-white' : 'bg-gray-300',
                        'text-center leading-none font-semibold',
                      )}
                    >
                      {DAY_TO_LETTER[day]}
                    </span>
                  ))}
                </div>
                <FaClock />
                <span>
                  <HighlightComponent attribute="IS_SCL_TIME_START" hit={course} />
                  {course.IS_SCL_TIME_START && '–'}
                  <HighlightComponent attribute="IS_SCL_TIME_END" hit={course} />
                </span>
              </>
            )}
        </div>
        {course.textDescription.length > 0 && (
        <>
          <hr className="border-black my-2" />
          <p className="text-sm line-clamp-3">
            <HighlightComponent attribute="textDescription" hit={course} />
          </p>
        </>
        )}
      </div>
    </div>
  );
};

export default CourseCard;
