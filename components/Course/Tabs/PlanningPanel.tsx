import { Tab, Switch } from '@headlessui/react';
import Link from 'next/link';
import React, { Fragment, useMemo } from 'react';
import {
  FaBan,
  FaCheckCircle,
  FaExclamationCircle,
  FaSmile,
} from 'react-icons/fa';
import { ExtendedClass } from 'plancrimson-utils';
import { Schedule } from 'plancrimson-utils';
import {
  sortSchedules,
  getClassId,
  classNames,
  checkViable,
} from 'plancrimson-utils';
import { ClassCache, Profile, Schedules } from '@/src/features';
import { useAppSelector, useAppDispatch } from '@/src/hooks';
import Tooltip from '../../Tooltip';

/**
 * The planning panel in the course modal. Returns a Tab.Panel.
 * @param course The course that's currently displayed in the modal
 */
export default function PlanningPanel({ course }: { course: ExtendedClass }) {
  const schedules = useAppSelector(Schedules.selectSchedules);

  if (Object.keys(schedules).length === 0) {
    return (
      <Tab.Panel>
        <p>
          Get started by
          {' '}
          <Link href="/" className="interactive font-bold">
            creating a schedule
          </Link>
          !
        </p>
      </Tab.Panel>
    );
  }

  return (
    <Tab.Panel>
      <div className="grid grid-cols-[1fr_1fr_auto] items-center gap-2">
        {sortSchedules(schedules).map((schedule) => (
          <ScheduleRow
            key={schedule.title}
            course={course}
            schedule={schedule}
          />
        ))}
      </div>
    </Tab.Panel>
  );
}

/**
 * For a given user schedule, shows the schedule title, semester,
 * and a switch to add this course to that schedule
 * @param schedule The schedule
 * @param course The course currently open in a modal
 */
function ScheduleRow({ schedule, course }: { schedule: Schedule; course: ExtendedClass }) {
  const dispatch = useAppDispatch();
  const classCache = useAppSelector(ClassCache.selectClassCache);
  const classYear = useAppSelector(Profile.selectClassYear);

  const enabled = !!schedule.classes.find(
    ({ classId }) => classId === getClassId(course),
  );

  const viabilityStatus = useMemo(() => (classYear ? checkViable({
    cls: course, schedule, classYear, classCache,
  }) : null), [course, schedule, classYear, classCache]);

  if (viabilityStatus === null) return null;

  function handleSwitch(checked: boolean) {
    if (checked) {
      if (viabilityStatus !== null && viabilityStatus.viability === 'No') {
        alert('This course is not being offered in this semester!');
      } else {
        dispatch(Schedules.addCourses({
          courses: [{ classId: getClassId(course) }],
          scheduleId: schedule.id,
        }));
      }
    } else {
      dispatch(Schedules.removeCourses({
        courseIds: [getClassId(course)],
        scheduleId: schedule.id,
      }));
    }
  }

  return (
    <>
      <span className="max-w-[12rem] overflow-hidden text-ellipsis font-semibold sm:max-w-[24rem]">
        {schedule.title}
      </span>
      <span className="text-gray-dark">{`${schedule.season} ${schedule.year}`}</span>
      <div className="relative flex flex-row-reverse">
        {/* Code from https://headlessui.dev/react/switch */}
        <Switch
          checked={enabled}
          // eslint-disable-next-line react/jsx-no-bind
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
    </>
  );
}
