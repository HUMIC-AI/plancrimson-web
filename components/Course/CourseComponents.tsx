import React, { Fragment } from 'react';
import {
  FaUser, FaMapMarkerAlt, FaCalendarDay, FaClock,
} from 'react-icons/fa';
import { DAYS_OF_WEEK, ExtendedClass } from '../../shared/apiTypes';
import { classNames } from '../../shared/util';
import Highlight from '../SearchComponents/Highlight';

type CourseProps = {
  course: ExtendedClass;
  // eslint-disable-next-line react/no-unused-prop-types
  inSearch?: boolean;
};

type HighlightComponentProps = {
  course: ExtendedClass;
  inSearch: boolean;
  attribute: keyof ExtendedClass;
};

export const HighlightComponent: React.FC<HighlightComponentProps> = function ({ inSearch, attribute, course }) {
  if (inSearch) return <Highlight hit={course} attribute={attribute} />;
  return <span>{course[attribute]}</span>;
};

export const Instructors: React.FC<CourseProps> = function ({ course, inSearch }) {
  const instructors = course.IS_SCL_DESCR_IS_SCL_DESCRL;

  return (
    <>
      <FaUser />
      {/* eslint-disable-next-line no-nested-ternary */}
      {instructors
        ? (typeof instructors === 'string'
          ? (
            <HighlightComponent
              course={course}
              attribute="IS_SCL_DESCR_IS_SCL_DESCRL"
              inSearch={inSearch || false}
            />
          )
          : <span>{instructors.join(', ')}</span>)
        : <span>Unknown</span>}
    </>
  );
};

export const Location: React.FC<CourseProps> = function ({ course, inSearch }) {
  return (
    <>
      <FaMapMarkerAlt />
      {course.SUBJECT.startsWith('MIT')
        ? <span>MIT</span>
        : (
          <span>
            <HighlightComponent
              course={course}
              attribute="LOCATION_DESCR_LOCATION"
              inSearch={inSearch || false}
            />
            {course.IS_SCL_DESCR_IS_SCL_DESCRG && ` (${course.IS_SCL_DESCR_IS_SCL_DESCRG})`}
          </span>
        )}
    </>
  );
};

const dayLetters = 'MTWRFSU';

const WeekDisplay: React.FC<{ pattern: string; index?: number; }> = function ({ pattern, index }) {
  const daysInSchedule = pattern.split(' ');
  return (
    <>
      <FaCalendarDay title={`Days of week${index ? ` ${index + 1}` : ''}`} />
      {pattern === 'TBA'
        ? <span>TBA</span>
        : (
          <div className="inline-grid grid-cols-7 max-w-xs border-2 border-gray-800 rounded overflow-hidden">
            {DAYS_OF_WEEK.map((val) => val.slice(0, 2)).map((abbrev, j) => (
              <span
                key={abbrev}
                className={classNames(
                  daysInSchedule.includes(abbrev) ? 'bg-gray-800 text-white' : 'bg-transparent',
                  'text-center font-semibold font-mono text-sm',
                )}
              >
                {dayLetters[j]}
              </span>
            ))}
          </div>
        )}
    </>
  );
};

export const DaysOfWeek: React.FC<CourseProps> = function ({ course }) {
  const days = course.IS_SCL_MEETING_PAT;
  if (typeof days === 'object') {
    return (
      <>
        {days.map((pattern, i) => (
          <WeekDisplay key={pattern} pattern={pattern} index={i} />
        ))}
      </>
    );
  }
  return <WeekDisplay pattern={days} />;
};

export const ClassTime: React.FC<CourseProps> = function ({ course, inSearch }) {
  const startTime = course.IS_SCL_TIME_START;
  const endTime = course.IS_SCL_TIME_END;
  if (typeof startTime === 'object') {
    return (
      <>
        {startTime.map((time, i) => (
          <Fragment key={time}>
            <FaClock title={`Class time ${i + 1}`} />
            {time}
            –
            {endTime[i]}
          </Fragment>
        ))}
      </>
    );
  }

  return (
    <>
      <FaClock title="Class time" />
      {startTime
        ? (
          <span>
            <HighlightComponent
              attribute="IS_SCL_TIME_START"
              course={course}
              inSearch={inSearch || false}
            />
            –
            <HighlightComponent
              attribute="IS_SCL_TIME_END"
              course={course}
              inSearch={inSearch || false}
            />
          </span>
        ) : <span>TBA</span>}
    </>
  );
};
