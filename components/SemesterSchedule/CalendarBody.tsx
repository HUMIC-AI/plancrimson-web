import React, { useState } from 'react';
import type { ClassSchedulingInfo } from '@/src/lib';
import {
  DAYS_OF_WEEK, DAY_SHORT, doesRRuleHaveDay,
  dateArrayToDec,
  dayEndTime,
  dayStartTime,
} from '@/src/lib';
import { EventAttributes } from 'ics';
import { FaArrowDown } from 'react-icons/fa';
import { MissingClass } from './MissingClass';
import { CalendarDayEventTilesColumn } from './CalendarDayEventTilesColumn';
import { CuteSwitch } from '../Utils/CuteSwitch';

export function CalendarBody({
  classes, events,
}: {
  classes: ClassSchedulingInfo[];
  events: EventAttributes[];
}) {
  const unscheduledClasses = classes.filter(
    (c) => c.IS_SCL_MEETING_PAT === 'TBA',
  );
  const [showSections, setShowSections] = useState(false);

  return (
    <div className="relative min-h-screen flex-1 overflow-auto md:mt-0 md:min-h-0">
      <div className="flex h-full flex-col items-stretch">
        <div className="relative mb-2">
          <h1 className="text-center text-xl font-semibold">Calendar</h1>
          <div className="absolute inset-y-0 right-2 flex items-center text-xs">
            <span className="mr-2">Show sections</span>
            <CuteSwitch enabled={showSections} onChange={setShowSections} />
          </div>
        </div>

        <div className="grid grid-cols-5 rounded-t-xl bg-black py-2 pl-6 text-white">
          {DAY_SHORT.slice(0, 5).map((day) => (
            <h4 key={day} className="text-center font-light">
              {day}
            </h4>
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
              <CalendarDayEventTilesColumn
                events={events
                  .filter((ev) => doesRRuleHaveDay(ev.recurrenceRule!, day))
                  .sort(
                    (a, b) => dateArrayToDec(a.start) - dateArrayToDec(b.start),
                  )}
                showSections={showSections}
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
          <h2 className="mt-4 flex items-center px-6 text-xl font-semibold">
            Unscheduled classes and sections
            <FaArrowDown className="ml-2" />
          </h2>
        )}
      </div>

      {unscheduledClasses.length > 0 && (
        <div className="p-6">
          <p>You can enter corrected times below.</p>
          <ul className="space-y-4">
            {unscheduledClasses.map((cls) => (
              <li key={cls.id}>
                <MissingClass cls={cls} />
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
