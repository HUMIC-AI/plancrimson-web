import React, { Fragment } from 'react';
import {
  FaUser, FaMapMarkerAlt, FaCalendarDay, FaClock,
} from 'react-icons/fa';
import { ExtendedClass, DAYS_OF_WEEK } from '@/src/lib';
import { classNames } from '@/src/utils/styles';
import Highlight from '../SearchComponents/Highlight';

type CourseProps = {
  course: ExtendedClass;
};

export const Instructors: React.FC<CourseProps> = function ({
  course,
}) {
  const instructors = course.IS_SCL_DESCR_IS_SCL_DESCRL;

  return (
    <>
      <FaUser />
      {instructors ? (
        typeof instructors === 'string' ? (
          <Highlight
            hit={course}
            attribute="IS_SCL_DESCR_IS_SCL_DESCRL"
          />
        ) : (
          <span>{instructors.join(', ')}</span>
        )
      ) : (
        <span>Unknown</span>
      )}
    </>
  );
};

export const Location: React.FC<CourseProps> = function ({ course }) {
  return (
    <>
      <FaMapMarkerAlt />
      {course.SUBJECT.startsWith('MIT') ? (
        <span>MIT</span>
      ) : (
        <span>
          <Highlight
            hit={course}
            attribute="LOCATION_DESCR_LOCATION"
          />
          {course.IS_SCL_DESCR_IS_SCL_DESCRG && (
            <>
              {' '}
              <span className="font-light">
                (
                {course.IS_SCL_DESCR_IS_SCL_DESCRG}
                )
              </span>
            </>
          )}
        </span>
      )}
    </>
  );
};

const dayLetters = 'MTWRFSU';

const WeekDisplay: React.FC<{ pattern: string; index?: number }> = function ({
  pattern,
  index,
}) {
  const daysInSchedule = pattern.split(' ');
  return (
    <>
      <FaCalendarDay title={`Days of week${index ? ` ${index + 1}` : ''}`} />
      {pattern === 'TBA' ? (
        <span>TBA</span>
      ) : (
        <div className="inline-grid w-max grid-cols-5 overflow-hidden rounded border border-gray-primary">
          {DAYS_OF_WEEK.slice(0, 5)
            .map((val) => val.slice(0, 2))
            .map((abbrev, j) => (
              <span
                key={abbrev}
                className={classNames(
                  daysInSchedule.includes(abbrev)
                    ? 'bg-secondary'
                    : 'text-transparent bg-gray-secondary',
                  'text-center font-medium font-mono text-sm leading-none w-4',
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

export const ClassTime: React.FC<CourseProps> = function ({
  course,
}) {
  const startTime = course.IS_SCL_TIME_START;
  const endTime = course.IS_SCL_TIME_END;
  if (typeof startTime === 'object' || typeof endTime === 'object') {
    return (
      <>
        {[startTime].flat().map((time, i) => (
          <Fragment key={time}>
            <FaClock title={`Class time ${i + 1}`} />
            {time}
            –
            {typeof endTime === 'string' ? endTime : endTime[i]}
          </Fragment>
        ))}
      </>
    );
  }

  return (
    <>
      <FaClock title="Class time" />
      {startTime ? (
        <span>
          <Highlight
            attribute="IS_SCL_TIME_START"
            hit={course}
          />
          –
          <Highlight
            attribute="IS_SCL_TIME_END"
            hit={course}
          />
        </span>
      ) : (
        <span>TBA</span>
      )}
    </>
  );
};
