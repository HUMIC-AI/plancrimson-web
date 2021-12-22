import React from 'react';
import { Class } from '../../src/types';

const days = ['MON', 'TUES', 'WED', 'THURS', 'FRI', 'SAT'] as const;

function toPercent(time: string) {
  const [hours, minutes] = time.slice(0, -2).split(':').map((val) => parseInt(val.trim(), 10));
  return ((((hours % 12) + (/pm$/i.test(time) ? 12 : 0)) * 60 + minutes) / (60 * 24)) * 100;
}

const Calendar: React.FC<{ classes: Class[] }> = function ({ classes }) {
  return (
    <div className="mt-2 rounded-md border-black border-2">
      <div className="pl-6 grid grid-cols-5">
        {days.slice(0, 5).map((day) => (
          <h1 className="font-semibold text-center">
            {day}
          </h1>
        ))}
      </div>

      <div className="relative h-96 overflow-scroll">

        {/* draw the hours on the left */}
        <div className="absolute w-6 inset-y-0 z-20 text-center bg-gray-500">
          {[...new Array(24)].map((_, i) => (
            <span
      // eslint-disable-next-line react/no-array-index-key
              key={i}
              style={{
                position: 'absolute',
                top: `${(i * 100) / 24}%`,
                transform: 'translate(-50%, -50%)',
              }}
            >
              {i}
            </span>
          ))}
        </div>

        {/* central courses area */}
        <div className="grid grid-cols-5 h-full relative ml-6">
          {days.slice(0, 5).map((day, i) => (
            <div key={day} className={`${i % 2 === 0 ? 'bg-gray-300' : 'bg-gray-100'} h-full text-center relative`}>
              {/* courses */}
              {classes.filter((cls) => cls[day] === 'Y').map(({
                Key, IS_SCL_DESCR100: title, IS_SCL_TIME_START: startTime, IS_SCL_TIME_END: endTime,
              }) => (
                <div
                  key={Key}
                  className="bg-blue-300 p-2 absolute w-full z-10"
                  style={{
                    top: `${toPercent(startTime)}%`,
                    bottom: `${100 - toPercent(endTime)}%`,
                  }}
                >
                  {title}
                </div>
              ))}
            </div>
          ))}

          {/* horizontal bars */}
          {[...new Array(24)].map((_, i) => (
            <hr
      // eslint-disable-next-line react/no-array-index-key
              key={i}
              className="absolute inset-x-0"
              style={{
                top: `${(i * 100) / 24}%`,
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default Calendar;
