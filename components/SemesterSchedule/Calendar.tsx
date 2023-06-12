import React from 'react';
import type { ExtendedClass } from '@/src/lib';
import {
  allTruthy, getClassId, DAYS_OF_WEEK, DAY_SHORT,
} from '@/src/lib';
import { useAppSelector } from '@/src/utils/hooks';
import { ClassCache, Settings } from '@/src/features';
import { BaseSchedule } from '@/src/types';
import {
  getEvents,
  doesRRuleHaveDay,
  dateArrayToDec,
  dayEndTime,
  dayStartTime,
} from './calendarUtil';
import { MissingClass } from './MissingClass';
import { DayComponent } from './DayComponent';
import { CalendarHeaderSection } from './HeaderSection';

type CalendarProps = {
  schedule: BaseSchedule;
  userId: string;
};


export default function Calendar({ schedule, userId }: CalendarProps) {
  const classCache = useAppSelector(ClassCache.selectClassCache);
  const classes = allTruthy(schedule.classes.map((classId) => classCache[classId]));

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
    <>
      <CalendarHeaderSection events={events} schedule={schedule} userId={userId} />

      <div className="mt-4 overflow-auto">
        <div className="min-w-[52rem]">
          <div className="grid grid-cols-5 rounded-t-xl bg-black py-2 pl-6 text-white">
            {DAY_SHORT.slice(0, 5).map((day) => (
              <h3 key={day} className="text-center font-semibold">
                {day}
              </h3>
            ))}
          </div>

          <div className="relative h-[60rem] overflow-auto">
            {/* draw the hours on the left */}
            <div className="absolute inset-y-0 z-10 w-6 bg-gray-secondary text-center">
              {[...new Array(dayEndTime - dayStartTime)].map((_, i) => (
                <span
                  key={i}
                  className="absolute -translate-x-1/2 -translate-y-1/2"
                  style={{
                    top: `${((i + 1) * 100) / (dayEndTime - dayStartTime + 1)}%`,
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
    </>
  );
}
