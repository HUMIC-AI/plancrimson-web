import { Tab, Switch } from '@headlessui/react';
import Link from 'next/link';
import React, { Fragment } from 'react';
import { FaExclamationCircle } from 'react-icons/fa';
import { ExtendedClass } from '../../../shared/apiTypes';
import {
  sortSchedules, getClassId, classNames, checkViable,
} from '../../../shared/util';
import useUserData from '../../../src/context/userData';

const PlanningPanel: React.FC<{ course: ExtendedClass }> = function ({ course }) {
  const { data: userData, addCourses, removeCourses } = useUserData();

  return (
    <Tab.Panel>
      {Object.keys(userData.schedules).length > 0 ? (
        <div className="grid grid-cols-[1fr_1fr_auto] items-center">
          {sortSchedules(userData.schedules).map((schedule) => {
            const enabled = !!schedule.classes.find(({ classId }) => classId === getClassId(course));
            return (
              <Fragment key={schedule.id}>
                <span className="font-semibold">{schedule.id}</span>
                <span className="text-gray-600">{`${schedule.season} ${schedule.year}`}</span>
                <div className="relative">
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
                      'focus:outline-none focus-visible:ring-2  focus-visible:ring-white focus-visible:ring-opacity-70',
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
                  {enabled && (checkViable(course, { year: schedule.year, season: schedule.season }) || (
                  <div className="group absolute inset-y-0 right-full mr-2 w-max flex flex-row-reverse items-center gap-2">
                    <FaExclamationCircle title="warning" />
                    <p className="hidden group-hover:block bg-gray-800 text-white max-w-[16rem] p-2 rounded-md">
                      This course may not be available during this semester!
                    </p>
                  </div>
                  ))}
                </div>
              </Fragment>
            );
          })}
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
