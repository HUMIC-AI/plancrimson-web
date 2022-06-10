/* eslint-disable jsx-a11y/label-has-associated-control */
import { Disclosure } from '@headlessui/react';
import React, { Fragment } from 'react';
import { useForm, FieldValues } from 'react-hook-form';
import { createEvents, DateArray, EventAttributes } from 'ics';
import { ExtendedClass } from '../../shared/apiTypes';
import { DAYS_OF_WEEK, DAY_SHORT } from '../../shared/firestoreTypes';
import { getClassId } from '../../shared/util';
import {
  strToDec,
  decToStr,
  getEvents,
  doesRRuleHaveDay,
} from './calendarUtil';
import { downloadJson, useAppDispatch, useAppSelector } from '../../src/hooks';
import { Schedules } from '../../src/features';

const dayStartTime = 8; // time to start the calendar at
const dayEndTime = 20;

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

type CalendarProps = {
  classes: ExtendedClass[];
};

function MissingClass({ cls }: { cls: ExtendedClass }) {
  const dispatch = useAppDispatch();
  const classId = getClassId(cls);
  const classTime = useAppSelector(Schedules.selectCustomTime(classId));

  const { register, handleSubmit } = useForm();

  const onSubmit = (data: FieldValues) => {
    const start = strToDec(data.startTime);
    const end = strToDec(data.endTime);
    if ([start, end].some(Number.isNaN) || start >= end) {
      alert('Invalid time. Please try again.');
    } else {
      dispatch(Schedules.customTime({
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
        <Disclosure.Button className="hover:opacity-50 font-bold underline transition-opacity">
          Add time
        </Disclosure.Button>
        <Disclosure.Panel>
          <form onSubmit={handleSubmit(onSubmit)} className="mt-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4">
              <div className="grid grid-cols-[auto_1fr] items-center p-2 border-2 shadow rounded-lg">
                {DAYS_OF_WEEK.slice(0, 5).map((day) => (
                  <Fragment key={classId + day}>
                    <label htmlFor={classId + day} className="text-right">
                      {day}
                    </label>
                    <input
                      type="checkbox"
                      id={classId + day}
                      className="py-1 px-2 ml-2"
                      defaultChecked={classTime?.pattern.includes(day)}
                      {...register(day)}
                    />
                  </Fragment>
                ))}
              </div>
              <div className="grid grid-cols-[1fr_auto] w-max items-center h-min mt-4 sm:mt-0">
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
              className="mt-4 bg-gray-300 interactive px-4 py-2 rounded-md"
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

function DayComponent({ events }: { events: EventAttributes[] }) {
  const overlapCounter: Record<string, number> = {};

  return (
    <div className="odd:bg-gray-300 even:bg-white h-full relative">
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
            className="bg-gray-800 bg-opacity-70 rounded absolute z-10 hover:z-20"
            style={{
              top: `${toPercent(ev.start)}%`,
              // @ts-expect-error
              bottom: `${100 - toPercent(ev.end)}%`,
              left: `${left * 100}%`,
              right: `${right * 100}%`,
            }}
          >
            <div className="absolute inset-2 overflow-auto flex flex-col items-center text-center text-white">
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

const Calendar: React.FC<CalendarProps> = function ({ classes }) {
  const customTimes = useAppSelector(Schedules.selectCustomTimes);

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

  function handleExport() {
    const { error, value } = createEvents(events);
    if (error) {
      console.error(error);
      alert(
        'There was an error exporting your schedule. Please try again later.',
      );
    } else if (value) {
      downloadJson('schedule', value, 'ics');
    }
  }

  const unscheduledClasses = classes.filter(
    (c) => c.IS_SCL_MEETING_PAT === 'TBA',
  );

  return (
    <div className="border-gray-800 sm:border-4 sm:rounded-lg shadow-lg">
      <div className="bg-gray-800 p-4 text-center">
        <button
          type="button"
          onClick={handleExport}
          className="bg-gray-300 interactive py-2 px-4 rounded-md"
        >
          Export to ICS
        </button>
      </div>
      <div className="overflow-auto">
        <div className="min-w-[52rem]">
          <div className="pl-6 py-2 bg-gray-800 text-white grid grid-cols-5">
            {DAY_SHORT.slice(0, 5).map((day) => (
              <h3 key={day} className="font-semibold text-center">
                {day}
              </h3>
            ))}
          </div>

          <div className="relative h-[60rem] overflow-auto">
            {/* draw the hours on the left */}
            <div className="absolute w-6 inset-y-0 z-10 text-center bg-gray-300">
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
            <div className="grid grid-cols-5 h-full relative ml-6">
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
              <h2 className="text-2xl font-semibold mb-4">Unscheduled classes</h2>
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
};

export default Calendar;
