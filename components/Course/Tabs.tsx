import { Switch, Tab } from '@headlessui/react';
import React, { Fragment } from 'react';
import {
  FaBook, FaUserGraduate, FaClipboardCheck, FaUserLock, FaSchool, FaBuilding, FaCoins, FaStar, FaUserClock, FaHourglassEnd, FaExchangeAlt,
} from 'react-icons/fa';
import useSWR from 'swr';
import {
  ExtendedClass,
} from '../../shared/apiTypes';
import {
  allTruthy, classNames, getClassId, getEvaluationId, getEvaluations, sortSchedules,
} from '../../shared/util';
import useUserData from '../../src/context/userData';
import {
  ClassTime, DaysOfWeek, Instructors, Location,
} from './CourseComponents';
import EvaluationComponent from './EvaluationComponent';

type Props = { course: ExtendedClass };

const InfoPanel: React.FC<Props> = function ({ course }) {
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
              {course.meanRating}
              {' '}
              average rating (1–5)
            </span>
          </>
        )}
        {course.meanClassSize && (
          <>
            <FaUserClock title="Average total number of students" />
            <span>
              {course.meanClassSize}
              {' '}
              students total on average
            </span>
          </>
        )}
        {course.meanHours && (
          <>
            <FaHourglassEnd title="Average number of hours spent outside of class" />
            <span>
              {course.meanHours}
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

const Tabs: React.FC<Props> = function ({ course }) {
  const { data, error } = useSWR(course ? course.SUBJECT + course.CATALOG_NBR : null, getEvaluations);
  const { data: userData, addCourses, removeCourses } = useUserData();

  return (
    <Tab.Group defaultIndex={0}>
      <Tab.List className="bg-gray-800 flex">
        {allTruthy([
          'Description',
          'More Info',
          'Evaluations',
          'Plan',
        ]).map((tab) => (
          <Tab
            key={tab}
            className={({ selected }) => (classNames(
              selected
                ? 'bg-blue-500 text-white'
                : 'bg-white text-gray-800 hover:opacity-50 transition-opacity',
              'flex-1 text-sm py-2 px-4 rounded-t-xl font-medium',
            ))}
          >
            {tab}
          </Tab>
        ))}
      </Tab.List>
      <Tab.Panels className="p-6 border-t-4 border-blue-500 bg-white">
        <Tab.Panel>
          <p className="max-w-lg">
            {course.textDescription || 'No description'}
          </p>
        </Tab.Panel>
        <InfoPanel course={course} />
        <Tab.Panel>
          {!error && !data && <span>Loading...</span>}
          {error && (
          <code>
            An error occurred loading evaluations:
            {' '}
            {JSON.stringify(error)}
          </code>
          )}
          {data && (data.length > 0 ? (
            <ul>
              {data.map((val) => (
                <li key={getEvaluationId(val)}>
                  <EvaluationComponent report={val} />
                </li>
              ))}
            </ul>
          ) : <p>No evaluations found.</p>)}
        </Tab.Panel>
        <Tab.Panel>
          <div className="grid grid-cols-[1fr_1fr_auto] items-center">
            {sortSchedules(userData.schedules).map((schedule) => {
              const enabled = !!schedule.classes.find(({ classId }) => classId === getClassId(course));
              return (
                <Fragment key={schedule.id}>
                  <span className="font-semibold">{schedule.id}</span>
                  <span className="text-gray-600">{`${schedule.season} ${schedule.year}`}</span>
                  {/* Code from https://headlessui.dev/react/switch */}
                  <Switch
                    checked={enabled}
                    onChange={(checked) => {
                      if (checked) addCourses({ classId: getClassId(course), scheduleId: schedule.id });
                      else removeCourses({ classId: getClassId(course), scheduleId: schedule.id });
                    }}
                    className={classNames(
                      enabled ? 'bg-teal-900' : 'bg-teal-700',
                      'relative inline-flex flex-shrink-0 h-[38px] w-[74px]',
                      'border-2 border-transparent rounded-full cursor-pointer',
                      'transition-colors ease-in-out duration-200',
                      'focus:outline-none focus-visible:ring-2  focus-visible:ring-white focus-visible:ring-opacity-75',
                    )}
                  >
                    <span
                      aria-hidden="true"
                      className={classNames(
                        enabled ? 'translate-x-9' : 'translate-x-0',
                        'pointer-events-none inline-block h-[34px] w-[34px] rounded-full',
                        'bg-white shadow-lg transform ring-0',
                        'transition ease-in-out duration-200',
                      )}
                    />
                  </Switch>
                </Fragment>
              );
            })}
          </div>
        </Tab.Panel>
      </Tab.Panels>
    </Tab.Group>
  );
};

export default Tabs;
