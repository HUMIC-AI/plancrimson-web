import { Tab, Switch } from '@headlessui/react';
import Link from 'next/link';
import React, { useMemo } from 'react';
import {
  FaBan,
  FaCheckCircle,
  FaExclamationCircle,
  FaSmile,
} from 'react-icons/fa';
import { ExtendedClass, getClassId } from '@/src/lib';
import {
  Auth, ClassCache, Profile, Schedules,
} from '@/src/features';
import { useAppSelector, useAppDispatch, useElapsed } from '@/src/utils/hooks';
import Tooltip from '@/components/Utils/Tooltip';
import { checkViable } from '@/src/searchSchedule';
import type { BaseSchedule } from '@/src/types';
import { classNames } from '@/src/utils/styles';
import { sortSchedulesBySemester } from '@/src/utils/schedules';
import { getClasses } from '@/src/features/schedules';
import { LoadingBars } from '@/components/Layout/LoadingPage';

/**
 * The planning panel in the course modal. Returns a Tab.Panel.
 * @param course The course that's currently displayed in the modal
 */
export default function ({ course }: { course: ExtendedClass }) {
  const userId = Auth.useAuthProperty('uid');
  const elapsed = useElapsed(500, [userId]);

  if (userId === null) {
    return (
      <Tab.Panel>
        You must be logged in to access this!
      </Tab.Panel>
    );
  }

  if (typeof userId === 'undefined') {
    return (
      <Tab.Panel>
        {elapsed && <LoadingBars />}
      </Tab.Panel>
    );
  }

  return <PlanningPanel course={course} />;
}

function PlanningPanel({ course }: { course: ExtendedClass }) {
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
        {sortSchedulesBySemester(schedules).map((schedule) => (
          <ScheduleRow
            key={schedule.id}
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
function ScheduleRow({ schedule, course }: { schedule: BaseSchedule; course: ExtendedClass }) {
  const dispatch = useAppDispatch();
  const classCache = useAppSelector(ClassCache.selectClassCache);
  const classYear = useAppSelector(Profile.selectClassYear);

  const enabled = !!getClasses(schedule).find(
    (classId) => classId === getClassId(course),
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
          courses: [getClassId(course)],
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
      <span className="text-gray-primary">{`${schedule.season} ${schedule.year}`}</span>
      <div className="relative flex flex-row-reverse">
        {/* Code from https://headlessui.dev/react/switch */}
        <Switch
          checked={enabled}
          onChange={(checked) => handleSwitch(checked)}
          className={classNames(
            enabled ? 'bg-blue-primary' : 'bg-blue-secondary',
            'relative inline-flex items-center h-[28px] w-[64px]',
            'border-2 border-transparent rounded-full cursor-pointer',
            'transition-colors ease-in-out duration-500',
            'focus:outline-none focus-visible:ring-2 focus-visible:ring-secondary/80',
          )}
        >
          {/* the actual circle part */}
          <span
            aria-hidden="true"
            className={classNames(
              enabled ? 'translate-x-9 bg-gray-secondary' : 'translate-x-0 bg-gray-primary',
              'pointer-events-none h-[24px] w-[24px] rounded-full',
              'shadow-lg transform ring-0',
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
