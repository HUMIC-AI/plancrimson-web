import React from 'react';
import { Tab } from '@headlessui/react';
import {
  FaBook, FaUserGraduate, FaClipboardCheck, FaUserLock, FaSchool, FaBuilding, FaCoins, FaStar, FaUserClock, FaHourglassEnd, FaExchangeAlt,
} from 'react-icons/fa';
import { ExtendedClass } from '../../../shared/apiTypes';
import {
  Instructors, DaysOfWeek, ClassTime, Location,
} from '../CourseComponents';

const InfoPanel: React.FC<{ course: ExtendedClass }> = function ({ course }) {
  return (
    <Tab.Panel>
      {/* Class information */}
      <div className="grid grid-cols-[auto_1fr] items-center gap-y-2 gap-x-4">
        <Instructors course={course} />
        <Location course={course} />
        <DaysOfWeek course={course} />
        <ClassTime course={course} />

        <FaBook title="Course type" />
        <span>{course.SSR_COMPONENTDESCR}</span>
        <FaUserGraduate title="Course level" />
        <span>{course.IS_SCL_DESCR100_HU_SCL_ATTR_LEVL}</span>
        <FaClipboardCheck title="Grading basis" />
        <span>{course.IS_SCL_DESCR100_HU_SCL_GRADE_BASIS}</span>
        <FaUserLock title="Enrolment cap" />
        <span>{course.ENRL_CAP}</span>
        <FaSchool title="School" />
        <span>{course.IS_SCL_DESCR_IS_SCL_DESCRB}</span>
        <FaBuilding title="Department(s)" />
        <span>{typeof course.ACAD_ORG === 'string' ? course.ACAD_ORG : course.ACAD_ORG.join(', ')}</span>
        <FaCoins title="Credits" />
        <span>
          {course.HU_UNITS_MIN === course.HU_UNITS_MAX ? course.HU_UNITS_MIN : `${course.HU_UNITS_MIN}–${course.HU_UNITS_MAX}`}
          {' '}
          credits
        </span>
        {course.meanRating && (
          <>
            <FaStar title="Average rating" />
            <span>
              {course.meanRating.toFixed(2)}
              {' '}
              average rating (1–5)
            </span>
          </>
        )}
        {course.meanClassSize && (
          <>
            <FaUserClock title="Average total number of students" />
            <span>
              {course.meanClassSize.toFixed(2)}
              {' '}
              students total on average
            </span>
          </>
        )}
        {course.meanHours && (
          <>
            <FaHourglassEnd title="Average number of hours spent outside of class" />
            <span>
              {course.meanHours.toFixed(2)}
              {' '}
              hours per week
            </span>
          </>
        )}
        <FaExchangeAlt title="Cross registration availability" />
        <span>{course.IS_SCL_DESCR100_HU_SCL_ATTR_XREG}</span>
      </div>
      <div>
        <h3 className="font-semibold mt-4">Recommended preparation</h3>
        <p className="mt-4">{course.HU_REC_PREP || 'None'}</p>
        <h3 className="font-semibold mt-4">Other details</h3>
        <p className="mt-2">{course.HU_COURSE_PREQ || 'None'}</p>
      </div>
    </Tab.Panel>
  );
};

export default InfoPanel;
