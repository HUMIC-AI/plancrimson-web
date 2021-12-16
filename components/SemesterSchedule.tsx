import { Course } from '../src/types';

const SemesterSchedule = function ({ mySchedule }: { mySchedule: Course[] }) {
  const startYear = 2021;
  return (
    <div className="h-full relative border-black border-2">
      <div className="absolute w-6 top-0 bottom-0 z-10 text-center bg-gray-500">

        {/* draw the times */}
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

      <div className="overflow-x-scroll h-full">
        <div className="grid grid-cols-8 min-w-max h-full relative ml-6">
          {[...new Array(5)].flatMap((_, i) => [
            { year: startYear + i, season: 'Spring' },
            { year: startYear + i, season: 'Fall' },
          ])
            .slice(1, -1) // get rid of first and last since of mismatch
            .map(({ year, season }, i) => (
              <div key={year + season} className={`${i % 2 === 0 ? 'bg-gray-300' : 'bg-gray-100'} h-full p-2 text-center w-72`}>
                <h1>
                  {`${year} ${season}`}
                </h1>
                <div className="flex flex-col">
                  {/* courses */}
                  {mySchedule.map((course) => {
                    const { IS_SCL_DESCR100: title } = course;
                    const courseSeason = /Fall/i.test(course.IS_SCL_DESCR_IS_SCL_DESCRH) ? 'Fall' : 'Spring' as const;
                    const academicYear = parseInt(course.ACAD_YEAR, 10);
                    const courseYear = courseSeason === 'Fall' ? academicYear - 1 : academicYear;
                    return { title, courseYear, courseSeason };
                  })
                    .filter(({ courseYear, courseSeason }) => courseYear === year && courseSeason === season)
                    .map(({ title }) => (
                      <div className="bg-blue-300 p-2">
                        {title}
                      </div>
                    ))}
                </div>
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
  );
};

export default SemesterSchedule;
