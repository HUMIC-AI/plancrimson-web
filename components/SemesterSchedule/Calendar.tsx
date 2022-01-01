import React from 'react';
import { ExtendedClass } from '../../shared/apiTypes';

const days = ['MON', 'TUES', 'WED', 'THURS', 'FRI', 'SAT'] as const;

function toPercent(time: string) {
  const [hours, minutes] = time.slice(0, -2).split(':').map((val) => parseInt(val.trim(), 10));
  return ((((hours % 12) + (/pm$/i.test(time) ? 12 : 0)) * 60 + minutes) / (60 * 24)) * 100;
}

const dayStartTime = 8; // time to start the calendar at

type CalendarProps = {
  classes: (ExtendedClass | null)[];
};

const Calendar: React.FC<CalendarProps> = function ({ classes }) {
  return (
    <div className="mt-2 rounded-md border-black border-2">
      <div className="pl-6 grid grid-cols-5">
        {days.slice(0, 5).map((day) => (
          <h1 key={day} className="font-semibold text-center">
            {day}
          </h1>
        ))}
      </div>

      <div className="relative h-96 overflow-scroll">

        {/* draw the hours on the left */}
        <div className="absolute w-6 inset-y-0 z-20 text-center bg-gray-500">
          {[...new Array(24 - dayStartTime)].map((_, i) => (
            <span
      // eslint-disable-next-line react/no-array-index-key
              key={i}
              style={{
                position: 'absolute',
                top: `${((i + 1) * 100) / (24 - dayStartTime + 1)}%`,
                transform: 'translate(-50%, -50%)',
              }}
            >
              {i + dayStartTime}
            </span>
          ))}
        </div>

        {/* central courses area */}
        <div className="grid grid-cols-5 h-full relative ml-6">
          {days.slice(0, 5).map((day) => (
            <div key={day} className="even:bg-gray-300 odd:bg-gray-100 h-full relative">
              {/* courses */}
              {(classes.filter((cls) => cls && cls[day] === 'Y') as ExtendedClass[]).map(({
                Key, SUBJECT: subject, CATALOG_NBR: catalogNumber, IS_SCL_TIME_START: startTime, IS_SCL_TIME_END: endTime,
              }) => (
                <div
                  key={Key}
                  className="bg-blue-300 rounded absolute w-full z-10 text-xs flex items-center justify-center text-center"
                  style={{
                    top: `${toPercent(startTime)}%`,
                    bottom: `${100 - toPercent(endTime)}%`,
                  }}
                >
                  {subject + catalogNumber}
                </div>
              ))}
            </div>
          ))}

          {/* horizontal bars */}
          {[...new Array(24 - dayStartTime)].map((_, i) => (
            <hr
              // eslint-disable-next-line react/no-array-index-key
              key={i}
              className="absolute inset-x-0"
              style={{
                top: `${((i + 1) * 100) / (24 - dayStartTime + 1)}%`,
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default Calendar;
