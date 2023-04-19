/* eslint-disable jsx-a11y/label-has-associated-control */
import { Disclosure } from '@headlessui/react';
import React, { Fragment } from 'react';
import { useForm, FieldValues } from 'react-hook-form';
import { createEvents, DateArray, EventAttributes } from 'ics';
import type { ExtendedClass } from '../../shared/apiTypes';
import type { Schedule } from '../../shared/types';
import {
  allTruthy, getClassId, DAYS_OF_WEEK, DAY_SHORT,
} from '../../shared/util';
import {
  strToDec,
  decToStr,
  getEvents,
  doesRRuleHaveDay,
} from './calendarUtil';
import { downloadJson, useAppDispatch, useAppSelector } from '../../src/hooks';
import { ClassCache, Settings } from '../../src/features';
import AddCoursesButton from '../CourseSearchModal';


const dayStartTime = 8; // time to start the calendar at
const dayEndTime = 20;

type CalendarProps = {
  schedule: Schedule;
};


export default function Calendar({ schedule }: CalendarProps) {
  const classCache = useAppSelector(ClassCache.selectClassCache);
  const classes = allTruthy(schedule.classes.map(({ classId }) => classCache[classId]));

  const customTimes = useAppSelector(Settings.selectCustomTimes);

  function extendCustomTime(cls: ExtendedClass): ExtendedClass {
    const classId = getClassId(cls);
    if (!(classId in customTimes)) return cls;
    return {
      ...cls,
      IS_SCL_MEETING_PAT: customTimes[classId].pattern
        .map((a) => a.slice(0, 2))
        .join(' '),
      IS_SCL_STRT_TM_DEC: customTimes[classId].start.toString(),
      IS_SCL_END_TM_DEC: customTimes[classId].end.toString(),
      START_DT: `${customTimes[classId].startDate}-00.00.00.000000`,
      END_DT: `${customTimes[classId].endDate}-00.00.00.000000`,
      // @ts-expect-error
      CUSTOM_PLANNED: true,
    };
  }

  const extendedClasses = classes.map(extendCustomTime);
  const events = extendedClasses.flatMap(getEvents);

  const unscheduledClasses = classes.filter(
    (c) => c.IS_SCL_MEETING_PAT === 'TBA',
  );

  return (
    <div className="border-gray-800 shadow-lg sm:rounded-lg sm:border-4">
      <HeaderSection events={events} schedule={schedule} />

      <div className="overflow-auto">
        <div className="min-w-[52rem]">
          <div className="grid grid-cols-5 bg-gray-800 py-2 pl-6 text-white">
            {DAY_SHORT.slice(0, 5).map((day) => (
              <h3 key={day} className="text-center font-semibold">
                {day}
              </h3>
            ))}
          </div>

          <div className="relative h-[60rem] overflow-auto">
            {/* draw the hours on the left */}
            <div className="absolute inset-y-0 z-10 w-6 bg-gray-300 text-center">
              {[...new Array(dayEndTime - dayStartTime)].map((_, i) => (
                <span
                // eslint-disable-next-line react/no-array-index-key
                  key={i}
                  style={{
                    position: 'absolute',
                    top: `${((i + 1) * 100) / (dayEndTime - dayStartTime + 1)}%`,
                    transform: 'translate(-50%, -50%)',
                  }}
                >
                  {i + dayStartTime}
                </span>
              ))}
            </div>

            {/* central courses area */}
            <div className="relative ml-6 grid h-full grid-cols-5">
              {DAYS_OF_WEEK.slice(0, 5).map((day) => (
                <DayComponent
                  events={events
                    .filter((ev) => doesRRuleHaveDay(ev.recurrenceRule!, day))
                    .sort(
                      (a, b) => dateArrayToDec(a.start) - dateArrayToDec(b.start),
                    )}
                  key={day}
                />
              ))}

              {/* horizontal bars */}
              {[...new Array(dayEndTime - dayStartTime)].map((_, i) => (
                <hr
                // eslint-disable-next-line react/no-array-index-key
                  key={i}
                  className="absolute inset-x-0"
                  style={{
                    top: `${((i + 1) * 100) / (dayEndTime - dayStartTime + 1)}%`,
                  }}
                />
              ))}
            </div>
          </div>

          {unscheduledClasses.length > 0 && (
            <div className="p-6">
              <h2 className="mb-4 text-2xl font-semibold">
                Unscheduled classes
              </h2>
              <ul className="space-y-4">
                {unscheduledClasses.map((cls) => (
                  <li key={cls.Key}>
                    <MissingClass cls={cls} />
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


function HeaderSection({ events, schedule }: { events: EventAttributes[], schedule: Schedule }) {
  function handleExport() {
    const { error, value } = createEvents(events);
    if (error) {
      console.error(error);
      alert('There was an error exporting your schedule. Please try again later.');
    } else if (value) {
      downloadJson('schedule', value, 'ics');
    }
  }

  return (
    <div className="flex items-center justify-center space-x-4 bg-gray-800 p-4 text-center">
      <p className="text-xl font-bold text-white">
        {schedule.title}
      </p>

      <p className="text-white">
        {schedule.year}
        {' '}
        {schedule.season}
      </p>

      <AddCoursesButton schedule={schedule}>Add courses</AddCoursesButton>

      <button
        type="button"
        onClick={handleExport}
        className="interactive rounded-xl bg-gray-300 px-4 py-2"
      >
        Export to ICS
      </button>
    </div>
  );
}


function DayComponent({ events }: { events: EventAttributes[] }) {
  const overlapCounter: Record<string, number> = {};

  return (
    <div className="relative h-full odd:bg-gray-300 even:bg-white">
      {events.map((ev, i) => {
        const overlap = getOverlap(events, i);
        const key = overlap[0].uid!;
        overlapCounter[key] = (overlapCounter[key] || 0) + 1;
        const left = (overlapCounter[key] - 1) / (overlap.length * 3);
        const right = (overlap.length - overlapCounter[key]) / (overlap.length * 3);
        const label = ev.title!.slice(0, ev.title!.indexOf('(') - 1);
        const title = ev.title!.slice(
          ev.title!.indexOf('(') + 1,
          ev.title!.length - 1,
        );
        return (
          <div
            // eslint-disable-next-line react/no-array-index-key
            key={ev.uid}
            className="absolute z-10 rounded bg-gray-800/70 hover:z-20"
            style={{
              top: `${toPercent(ev.start)}%`,
              // @ts-expect-error
              bottom: `${100 - toPercent(ev.end)}%`,
              left: `${left * 100}%`,
              right: `${right * 100}%`,
            }}
          >
            <div className="absolute inset-2 flex flex-col items-center overflow-auto text-center text-white">
              <span className="font-semibold">{label}</span>
              <span>{title}</span>
              <span className="italic">{ev.location}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}


function MissingClass({ cls }: { cls: ExtendedClass }) {
  const dispatch = useAppDispatch();
  const classId = getClassId(cls);
  const classTime = useAppSelector(Settings.selectCustomTime(classId));

  const { register, handleSubmit } = useForm();

  const onSubmit = (data: FieldValues) => {
    const start = strToDec(data.startTime);
    const end = strToDec(data.endTime);
    if ([start, end].some(Number.isNaN) || start >= end) {
      alert('Invalid time. Please try again.');
    } else {
      dispatch(Settings.customTime({
        classId,
        pattern: DAYS_OF_WEEK.filter((day) => data[day]),
        start,
        end,
        startDate: data.startDate,
        endDate: data.endDate,
      }));
    }
  };

  return (
    <>
      <h4>{`${cls.SUBJECT + cls.CATALOG_NBR} | ${cls.Title}`}</h4>
      <Disclosure as="div">
        <Disclosure.Button className="font-bold underline transition-opacity hover:opacity-50">
          Add time
        </Disclosure.Button>
        <Disclosure.Panel>
          <form onSubmit={handleSubmit(onSubmit)} className="mt-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4">
              <div className="grid grid-cols-[auto_1fr] items-center rounded-lg border-2 p-2 shadow">
                {DAYS_OF_WEEK.slice(0, 5).map((day) => (
                  <Fragment key={classId + day}>
                    <label htmlFor={classId + day} className="text-right">
                      {day}
                    </label>
                    <input
                      type="checkbox"
                      id={classId + day}
                      className="ml-2 px-2 py-1"
                      defaultChecked={classTime?.pattern.includes(day)}
                      {...register(day)}
                    />
                  </Fragment>
                ))}
              </div>
              <div className="mt-4 grid h-min w-max grid-cols-[1fr_auto] items-center sm:mt-0">
                <label htmlFor="startTime" className="mr-2 text-right">
                  Start time:
                </label>
                <input
                  type="time"
                  {...register('startTime')}
                  defaultValue={classTime && decToStr(classTime.start)}
                />

                <label htmlFor="endTime" className="mr-2 text-right">
                  End time:
                </label>
                <input
                  type="time"
                  {...register('endTime')}
                  defaultValue={classTime && decToStr(classTime.end)}
                />

                <label htmlFor="startDate" className="mr-2 text-right">
                  Start date:
                </label>
                <input
                  type="date"
                  {...register('startDate')}
                  id="startDate"
                  defaultValue={classTime?.startDate}
                />

                <label htmlFor="endDate" className="mr-2 text-right">
                  End date:
                </label>
                <input
                  type="date"
                  {...register('endDate')}
                  id="endDate"
                  defaultValue={classTime?.endDate}
                />
              </div>
            </div>
            <button
              type="submit"
              className="interactive mt-4 rounded-md bg-gray-300 px-4 py-2"
            >
              Save
            </button>
          </form>
        </Disclosure.Panel>
      </Disclosure>
    </>
  );
}


function getOverlap(events: EventAttributes[], i: number) {
  const [start1, end1] = [events[i].start, (events[i] as any).end].map(
    dateArrayToDec,
  );
  return events.filter((ev) => {
    const [start, end] = [ev.start, (ev as any).end].map(dateArrayToDec);
    if (start > end1 || end < start1) return false;
    return true;
  });
}

function dateArrayToDec(arr: DateArray) {
  return arr[3]! + arr[4]! / 60;
}

function toPercent(arr: DateArray) {
  return (
    ((dateArrayToDec(arr) - (dayStartTime - 1))
      / (dayEndTime - (dayStartTime - 1)))
    * 100
  );
}
