import { Tab, Switch } from '@headlessui/react';
import Link from 'next/link';
import React, { Fragment, useMemo } from 'react';
import {
  FaBan,
  FaCheckCircle,
  FaExclamationCircle,
  FaSmile,
} from 'react-icons/fa';
import { ExtendedClass } from '../../../shared/apiTypes';
import { Schedule } from '../../../shared/firestoreTypes';
import {
  sortSchedules,
  getClassId,
  classNames,
  checkViable,
} from '../../../shared/util';
import { useAppDispatch, useAppSelector } from '../../../src/app/hooks';
import { selectClassCache } from '../../../src/features/classCache';
import {
  addCourse, removeCourses, selectScheduleData, selectSchedules,
} from '../../../src/features/schedules';
import { selectClassYear, selectLastLoggedIn } from '../../../src/features/userData';
import Tooltip from '../../Tooltip';

const ScheduleRow: React.FC<{ schedule: Schedule; course: ExtendedClass }> = function ({ schedule, course }) {
  const dispatch = useAppDispatch();
  const scheduleData = useAppSelector(selectScheduleData);
  const classCache = useAppSelector(selectClassCache);
  const classYear = useAppSelector(selectClassYear);
  const lastLoggedIn = useAppSelector(selectLastLoggedIn);

  const enabled = !!schedule.classes.find(
    ({ classId }) => classId === getClassId(course),
  );
  const viabilityStatus = useMemo(() => {
    const semester = { year: schedule.year, season: schedule.season };
    return checkViable(course, semester, { ...scheduleData, classYear, lastLoggedIn }, classCache);
  }, [schedule.year, schedule.season, course, scheduleData, classYear, lastLoggedIn, classCache]);

  const handleSwitch = (checked: boolean) => {
    if (checked) {
      if (viabilityStatus.viability === 'No') {
        alert('This course is not being offered in this semester!');
      } else {
        dispatch(addCourse([{
          classId: getClassId(course),
          scheduleId: schedule.id,
        }]));
      }
    } else {
      dispatch(removeCourses([{
        classId: getClassId(course),
        scheduleId: schedule.id,
      }]));
    }
  };

  return (
    <Fragment key={schedule.id}>
      <span className="font-semibold max-w-[12rem] sm:max-w-[24rem] overflow-hidden text-ellipsis">
        {schedule.id}
      </span>
      <span className="text-gray-600">{`${schedule.season} ${schedule.year}`}</span>
      <div className="flex flex-row-reverse relative">
        {/* Code from https://headlessui.dev/react/switch */}
        <Switch
          checked={enabled}
          onChange={handleSwitch}
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
        <div className="mr-2 flex items-center">
          <Tooltip text={viabilityStatus.reason} direction="left">
            {viabilityStatus.viability === 'Yes' && (
            <FaCheckCircle title="Offered" />
            )}
            {viabilityStatus.viability === 'Likely' && (
            <FaSmile title="Likely to be offered" />
            )}
            {viabilityStatus.viability === 'Unlikely' && (
            <FaExclamationCircle title="Unlikely to be offered" />
            )}
            {viabilityStatus.viability === 'No' && (
            <FaBan title="Not offered" />
            )}
          </Tooltip>
        </div>
      </div>
    </Fragment>
  );
};

const PlanningPanel: React.FC<{ course: ExtendedClass }> = function ({
  course,
}) {
  const schedules = useAppSelector(selectSchedules);
  return (
    <Tab.Panel>
      {Object.keys(schedules).length > 0 ? (
        <div className="grid grid-cols-[1fr_1fr_auto] gap-2 items-center">
          {sortSchedules(schedules).map((schedule) => (
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
