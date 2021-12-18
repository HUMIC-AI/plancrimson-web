import { useState } from 'react';
import { useUser } from '../src/userContext';
import { filterBySemester, getSemesters } from './Course';

const days = ['MON', 'TUES', 'WED', 'THURS', 'FRI', 'SAT'] as const;
// const dayLetters = 'MTWRFSU';

function toPercent(time: string) {
  const [hours, minutes] = time.slice(0, -2).split(':').map((val) => parseInt(val.trim(), 10));
  return ((((hours % 12) + (/pm$/i.test(time) ? 12 : 0)) * 60 + minutes) / (60 * 24)) * 100;
}

const SemesterSchedule: React.FC = function () {
  const { schedule, courseCache } = useUser();
  const [semester, setSemester] = useState<{ season: string; year: number } | null>(null);
  return (
    <div style={{ height: '108rem' }}>
      <div>
        <h2>
          Semesters:
        </h2>
        <div className="grid grid-cols-4 sm:grid-cols-8">
          {getSemesters(2021).map(({ year, season }) => (
            <button
              key={year + season}
              type="button"
              className={`${semester && semester.season === season && semester.year === year
                ? 'bg-green-300 hover:bg-green-500' : 'bg-blue-300 hover:bg-blue-500'} p-2`}
              onClick={() => setSemester({ season, year })}
            >
              {`${season} ${year} (${filterBySemester(schedule, year, season).length})`}
            </button>
          ))}
        </div>
      </div>

      <div className="h-full relative border-black border-2">

        {/* draw the hours on the left */}
        <div className="absolute w-6 top-0 bottom-0 z-20 text-center bg-gray-500">
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
        <div className="overflow-x-scroll h-full">
          <div className="grid grid-cols-5 min-w-max h-full relative ml-6">
            {days.slice(0, 5).map((day, i) => (
              <div key={day} className={`${i % 2 === 0 ? 'bg-gray-300' : 'bg-gray-100'} h-full text-center w-48 relative`}>
                <h1>
                  {day}
                </h1>
                {/* courses */}
                {semester && filterBySemester(schedule, semester.year, semester.season).filter(({ course }) => courseCache[course][day] === 'Y').map(({
                  course,
                }) => {
                  const {
                    Key, IS_SCL_DESCR100: title, IS_SCL_TIME_START: startTime, IS_SCL_TIME_END: endTime,
                  } = courseCache[course];
                  return (
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
                  );
                })}
              </div>
            ))}

            {/* horizontal bars */}
            {[...new Array(24)].map((_, i) => (
              <hr
            // eslint-disable-next-line react/no-array-index-key
                key={i}
                className="absolute left-0 right-0"
                style={{
                  top: `${(i * 100) / 24}%`,
                }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SemesterSchedule;
