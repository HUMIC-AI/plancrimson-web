import { Tab, Switch } from '@headlessui/react';
import Link from 'next/link';
import React, { Fragment, useMemo } from 'react';
import {
  FaBan, FaCheckCircle, FaExclamationCircle, FaSmile,
} from 'react-icons/fa';
import { ExtendedClass } from '../../../shared/apiTypes';
import { Schedule } from '../../../shared/firestoreTypes';
import {
  sortSchedules, getClassId, classNames, checkViable,
} from '../../../shared/util';
import useUserData from '../../../src/context/userData';

const ScheduleRow: React.FC<{ schedule: Schedule; course: ExtendedClass; }> = function ({ schedule, course }) {
  const { data, addCourses, removeCourses } = useUserData();
  const enabled = !!schedule.classes.find(({ classId }) => classId === getClassId(course));
  const viabilityStatus = useMemo(
    () => {
      const semester = { year: schedule.year, season: schedule.season };
      return checkViable(course, semester, data);
    },
    [schedule, course, data],
  );

  return (
    <Fragment key={schedule.id}>
      <span className="font-semibold">{schedule.id}</span>
      <span className="text-gray-600">{`${schedule.season} ${schedule.year}`}</span>
      <div className="relative">
        {/* Code from https://headlessui.dev/react/switch */}
        <Switch
          checked={enabled}
          onChange={(checked) => {
            if (checked) {
              if (viabilityStatus.viability === 'No') {
                alert('This course is not being offered in this semester!');
              } else {
                addCourses({ classId: getClassId(course), scheduleId: schedule.id });
              }
            } else {
              removeCourses({ classId: getClassId(course), scheduleId: schedule.id });
            }
          }}
          className={classNames(
            enabled ? 'bg-teal-600' : 'bg-teal-900',
            'relative inline-flex items-center h-[28px] w-[64px]',
            'border-2 border-transparent rounded-full cursor-pointer',
            'transition-colors ease-in-out duration-100',
            'focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-opacity-70',
          )}
        >
          <span
            aria-hidden="true"
            className={classNames(
              enabled ? 'translate-x-9' : 'translate-x-0',
              'pointer-events-none h-[24px] w-[24px] rounded-full',
              'bg-white shadow-lg transform ring-0',
              'transition ease-in-out duration-200',
            )}
          />
        </Switch>
        <div className="group absolute inset-y-0 right-full mr-2 w-max flex flex-row-reverse items-center gap-2">
          {viabilityStatus.viability === 'Yes' && <FaCheckCircle title="Offered" />}
          {viabilityStatus.viability === 'Likely' && <FaSmile title="Likely to be offered" />}
          {viabilityStatus.viability === 'Unlikely' && <FaExclamationCircle title="Unlikely to be offered" />}
          {viabilityStatus.viability === 'No' && <FaBan title="Not offered" />}
          <p className="hidden group-hover:block bg-gray-800 text-white max-w-[16rem] p-2 rounded-md">
            {viabilityStatus.reason}
          </p>
        </div>
      </div>
    </Fragment>
  );
};

const PlanningPanel: React.FC<{ course: ExtendedClass }> = function ({ course }) {
  const { data: userData } = useUserData();

  return (
    <Tab.Panel>
      {Object.keys(userData.schedules).length > 0 ? (
        <div className="grid grid-cols-[1fr_1fr_auto] items-center">
          {sortSchedules(userData.schedules).map((schedule) => (
            <ScheduleRow
              key={schedule.id}
              course={course}
              schedule={schedule}
            />
          ))}
        </div>
      ) : (
        <p>
          Get started by
          {' '}
          <Link href="/schedule">
            {/* eslint-disable-next-line jsx-a11y/anchor-is-valid */}
            <a className="font-bold hover:opacity-50 transition-opacity">
              creating a schedule
            </a>
          </Link>
          !
        </p>
      )}
    </Tab.Panel>
  );
};

export default PlanningPanel;
