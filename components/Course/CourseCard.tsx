import React from 'react';
import {
  FaInfo, FaTimes, FaPlus, FaUser, FaMapMarkerAlt, FaClock, FaCalendarDay,
} from 'react-icons/fa';
import { Highlight } from 'react-instantsearch-dom';
import {
  DAYS_OF_WEEK, DAY_TO_KEY, DAY_TO_LETTER, ExtendedClass,
} from '../../shared/apiTypes';
import { Schedule } from '../../shared/firestoreTypes';
import { getClassId, classNames } from '../../shared/util';
import useUserData from '../../src/context/userData';

type Props = {
  course: ExtendedClass;
  selectedSchedule: Schedule | null;
  handleExpand: () => void;
};

const CourseCard: React.FC<Props> = function ({ course, selectedSchedule, handleExpand }) {
  const { addCourses, removeCourses } = useUserData();

  return (
    <div className="rounded-xl shadow overflow-hidden border-gray-800 border-4">
      <div className="bg-gray-800 p-2 text-white">
        <p className="flex justify-between items-center">
          <span className="font-bold text-blue-300">
            <Highlight attribute="SUBJECT" hit={course} />
            <Highlight attribute="CATALOG_NBR" hit={course} />
          </span>
          <span className="flex items-center gap-2 ml-2">
            <button type="button" className="bg-black bg-opacity-0 hover:bg-opacity-50 transition-colors rounded p-1" onClick={handleExpand}>
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
          <Highlight attribute="Title" hit={course} />
        </h3>
      </div>
      <div className="p-2">
        <div className="inline-grid grid-cols-[auto_1fr] items-center gap-y-2 gap-x-4">
          <FaUser />
          <span>{course.IS_SCL_DESCR_IS_SCL_DESCRL || 'Unknown'}</span>
          <FaMapMarkerAlt />
          {course.SUBJECT.startsWith('MIT') ? <span>MIT</span> : <Highlight attribute="LOCATION_DESCR_LOCATION" hit={course} />}
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
                  <Highlight attribute="IS_SCL_TIME_START" hit={course} />
                  {course.IS_SCL_TIME_START && '–'}
                  <Highlight attribute="IS_SCL_TIME_END" hit={course} />
                </span>
              </>
            )}
        </div>
        {course.textDescription.length > 0 && (
        <>
          <hr className="border-black my-2" />
          <p className="text-sm line-clamp-3">
            <Highlight attribute="textDescription" hit={course} />
          </p>
        </>
        )}
      </div>
    </div>
  );
};

export default CourseCard;
