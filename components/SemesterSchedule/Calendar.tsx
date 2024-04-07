import React from 'react';
import type { ExtendedClass } from '@/src/lib';
import {
  allTruthy, getClassId, DAYS_OF_WEEK, DAY_SHORT,
  getEvents,
  doesRRuleHaveDay,
  dateArrayToDec,
  dayEndTime,
  dayStartTime,
} from '@/src/lib';
import { useAppSelector } from '@/src/utils/hooks';
import { ClassCache, Settings } from '@/src/features';
import { BaseSchedule } from '@/src/types';
import { EventAttributes } from 'ics';
import { MissingClass } from './MissingClass';
import { DayComponent } from './DayComponent';
import { CalendarHeaderSection } from './CalendarPageHeaderSection';

type CalendarProps = {
  schedule: BaseSchedule;
};


/**
 * Main calendar view of the Calendar page.
 */
export default function Calendar({ schedule }: CalendarProps) {
  const classCache = useAppSelector(ClassCache.selectClassCache);
  const classes = allTruthy(schedule.classes ? schedule.classes.map((classId) => classCache[classId]) : []);

  const customTimes = useAppSelector(Settings.selectCustomTimes);

  /**
   * Extends a class with user-provided custom time information
   */
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
      CUSTOM_PLANNED: true,
    };
  }

  const extendedClasses = classes.map(extendCustomTime);
  const events = extendedClasses.flatMap(getEvents);

  return (
    <div className="flex flex-col md:absolute md:inset-4 md:flex-row md:space-x-4">
      <CalendarHeaderSection events={events} schedule={schedule} />
      <CalendarBody classes={extendedClasses} events={events} />
    </div>
  );
}

function CalendarBody({
  classes,
  events,
}: {
  classes: ExtendedClass[];
  events: EventAttributes[];
}) {
  const unscheduledClasses = classes.filter(
    (c) => c.IS_SCL_MEETING_PAT === 'TBA',
  );

  return (
    <div className="relative mt-4 flex-1 overflow-auto md:mt-0">
      <div className="flex h-full flex-col items-stretch">
        <div className="grid grid-cols-5 rounded-t-xl bg-black py-2 pl-6 text-white">
          {DAY_SHORT.slice(0, 5).map((day) => (
            <h3 key={day} className="text-center font-semibold">
              {day}
            </h3>
          ))}
        </div>

        <div className="relative flex-1 overflow-auto">
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
          <div className="absolute inset-y-0 left-6 right-0 grid grid-cols-5">
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
  );
}
