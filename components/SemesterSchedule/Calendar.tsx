/* eslint-disable jsx-a11y/label-has-associated-control */
import { Disclosure } from '@headlessui/react';
import React from 'react';
import { useForm, FieldValues } from 'react-hook-form';
import { ExtendedClass } from '../../shared/apiTypes';
import { DAYS_OF_WEEK, DAY_SHORT } from '../../shared/firestoreTypes';
import { allTruthy, getClassId } from '../../shared/util';
import useUserData from '../../src/context/userData';

const dayStartTime = 8; // time to start the calendar at

function toPercent(time: number) {
  return ((time - (dayStartTime - 1)) / (24 - (dayStartTime - 1))) * 100;
}

type CalendarProps = {
  classes: ExtendedClass[];
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
  const otherClasses: ExtendedClass[] = [];

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
      otherClasses.push(cls);
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
      otherClasses.push(cls);
    }
  });

  return [validClasses, otherClasses] as const;
};

function MissingClass({ cls }: { cls: ExtendedClass }) {
  const { setCustomTime } = useUserData();
  const { register, handleSubmit } = useForm();

  const onSubmit = (data: FieldValues) => {
    const [h1, m1] = data.startTime.split(':').map(parseFloat);
    const [h2, m2] = data.endTime.split(':').map(parseFloat);
    if ([h1, m1, h2, m2].some(Number.isNaN)) {
      alert('Invalid time. Please try again.');
    } else {
      setCustomTime(
        getClassId(cls),
        data.daysOfWeek,
        h1 + m1 / 60,
        h2 + m2 / 60,
      ).then(() => alert('done'));
    }
  };

  return (
    <>
      <h4 className="inline-block">
        {`${cls.SUBJECT + cls.CATALOG_NBR} | ${cls.Title}`}
      </h4>
      <Disclosure as="div">
        <Disclosure.Button className="hover:opacity-50 font-bold underline transition-opacity">
          Add time
        </Disclosure.Button>
        <Disclosure.Panel>
          <form onSubmit={handleSubmit(onSubmit)}>
            <div>
              <select multiple {...register('daysOfWeek')}>
                {DAYS_OF_WEEK.slice(0, 5).map((day) => (
                  <option key={day} value={day}>
                    {day}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="startTime">Start time:</label>
              <input type="time" {...register('startTime')} />
            </div>
            <div>
              <label htmlFor="endTime">End time:</label>
              <input type="time" {...register('endTime')} />
            </div>
            <button type="submit">Save</button>
          </form>
        </Disclosure.Panel>
      </Disclosure>
    </>
  );
}

function decToStr(dec: number) {
  const hours = Math.floor(dec);
  return `${hours.toString().padStart(2, '0')}:${(dec - hours)
    .toFixed(2)
    .slice(2)}`;
}

const Calendar: React.FC<CalendarProps> = function ({ classes }) {
  const {
    data: { customTimes },
  } = useUserData();

  const [validClasses, otherClasses] = getCalendarClasses(
    allTruthy(
      classes.map((cls) => {
        const classId = getClassId(cls);
        if (classId in customTimes) {
          const result: ExtendedClass = {
            ...cls,
            IS_SCL_MEETING_PAT: customTimes[classId].pattern
              .map((a) => a.slice(0, 2))
              .join(' '),
            IS_SCL_STRT_TM_DEC: decToStr(customTimes[classId].start),
            IS_SCL_END_TM_DEC: decToStr(customTimes[classId].end),
          };
          return result;
        }
        return cls;
      }),
    ),
  );

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
              <li key={cls.Key}>
                <MissingClass cls={cls} />
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default Calendar;
