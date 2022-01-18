/* eslint-disable jsx-a11y/label-has-associated-control */
import { Disclosure } from '@headlessui/react';
import React from 'react';
import { DAYS_OF_WEEK, DAY_SHORT, ExtendedClass } from '../../shared/apiTypes';
import { allTruthy } from '../../shared/util';

const dayStartTime = 8; // time to start the calendar at

function toPercent(time: number) {
  return ((time - (dayStartTime - 1)) / (24 - (dayStartTime - 1))) * 100;
}

type CalendarProps = {
  classes: (ExtendedClass | null)[];
};

type TimeData = {
  label: string;
  title: string;
  location: string;
  startTime: number;
  endTime: number;
};

type ExtendedTimeData = TimeData & {
  pattern: string;
  i: number;
};

const getCalendarClasses = (classes: ExtendedClass[]) => {
  const validClasses: TimeData[][] = new Array(7).fill(null).map(() => []);
  const otherClasses: string[] = [];

  const addClass = ({
    pattern,
    i,
    startTime,
    endTime,
    title,
    label,
    location,
  }: ExtendedTimeData) => {
    if (!pattern.includes(DAYS_OF_WEEK[i].slice(0, 2))) return false;
    validClasses[i].push({
      title,
      startTime,
      endTime,
      label,
      location,
    });
    return true;
  };

  classes.forEach((cls) => {
    const label = cls.SUBJECT + cls.CATALOG_NBR;
    const title = cls.Title;
    const location = cls.LOCATION_DESCR_LOCATION;
    const startTime = cls.IS_SCL_STRT_TM_DEC;
    const endTime = cls.IS_SCL_END_TM_DEC;
    const meetingPattern = cls.IS_SCL_MEETING_PAT;
    if (!startTime || !meetingPattern || !endTime || meetingPattern === 'TBA') {
      otherClasses.push(title);
      return;
    }

    const added = DAYS_OF_WEEK.map((_, i) => {
      if (typeof meetingPattern === 'string') {
        return addClass({
          pattern: meetingPattern,
          // can be confident these are strings
          // since meetingPattern, startTime and endTime all have the same type
          startTime: parseFloat(startTime as string),
          endTime: parseFloat(endTime as string),
          i,
          title,
          label,
          location,
        });
      }
      return meetingPattern.some((pattern, j) => addClass({
        pattern,
        startTime: parseFloat(startTime[j]),
        endTime: parseFloat(
          typeof endTime === 'string' ? endTime : endTime[j],
        ),
        i,
        title,
        label,
        location,
      }));
    }).some((val) => val);

    if (!added) {
      otherClasses.push(title);
    }
  });

  return [validClasses, otherClasses] as const;
};

const Calendar: React.FC<CalendarProps> = function ({ classes }) {
  const [validClasses, otherClasses] = getCalendarClasses(allTruthy(classes));

  return (
    <div className="sm:rounded-lg border-gray-800 sm:border-4 shadow-lg">
      <div className="pl-6 py-2 bg-gray-800 text-white grid grid-cols-5">
        {DAY_SHORT.slice(0, 5).map((day) => (
          <h1 key={day} className="font-semibold text-center">
            {day}
          </h1>
        ))}
      </div>

      <div className="relative h-[60rem] overflow-auto">
        {/* draw the hours on the left */}
        <div className="absolute w-6 inset-y-0 z-20 text-center bg-gray-300">
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
          {validClasses.slice(0, 5).map((classesToday, i) => (
            <div
              // eslint-disable-next-line react/no-array-index-key
              key={i}
              className="odd:bg-gray-300 even:bg-white h-full relative"
            >
              {/* courses */}
              {classesToday.map(
                ({
                  label, title, location, startTime, endTime,
                }) => (
                  <div
                    // eslint-disable-next-line react/no-array-index-key
                    key={title + startTime + i}
                    className="bg-gray-800 bg-opacity-70 text-white rounded absolute w-full z-10 text-xs flex flex-col items-center justify-center p-2"
                    style={{
                      top: `${toPercent(startTime)}%`,
                      bottom: `${100 - toPercent(endTime)}%`,
                    }}
                  >
                    <span className="truncate max-w-full">{label}</span>
                    <span className="truncate max-w-full">{title}</span>
                    <span className="truncate max-w-full">{location}</span>
                  </div>
                ),
              )}
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

      {otherClasses.length > 0 && (
        <div className="p-6">
          <h2 className="text-lg font-semibold">Other classes</h2>
          <ul className="list-disc list-inside">
            {otherClasses.map((cls) => (
              <li key={cls}>
                <div>
                  <h4>{cls}</h4>
                  <Disclosure>
                    <Disclosure.Button>Add time</Disclosure.Button>
                    <Disclosure.Panel>
                      <form>
                        <label htmlFor="startTime">Start time:</label>
                        <input type="time" name="startTime" id="startTime" />
                        <label htmlFor="endTime">End time:</label>
                        <input type="time" name="endTime" id="endTime" />
                      </form>
                    </Disclosure.Panel>
                  </Disclosure>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default Calendar;
