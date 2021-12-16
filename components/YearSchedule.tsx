import gsap from 'gsap';
import { createRef, useEffect, useState } from 'react';
import { Course } from '../src/types';

const days = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];
const dayLetters = 'MTWRFSU';

const CourseCard = function ({ course }: { course: Course }) {
  const { SUBJECT: subject, CATALOG_NBR: rawCatalogNumber, IS_SCL_DESCR100: title } = course;
  const [open, setOpen] = useState(false);
  const catalogNumber = parseInt(rawCatalogNumber.trim(), 10);
  const cardRef = createRef<HTMLButtonElement>();

  // useEffect(() => {
  //   gsap.to(cardRef.current, { rotateY: 90, duration: 0.25 });
  //   gsap.to(cardRef.current, {
  //     onStart: () => setSide((prev) => !prev),
  //     rotateY: open ? 180 : 0,
  //     duration: 0.25,
  //     delay: 0.25,
  //   });
  // }, [open]);

  return (
    <button
      type="button"
      className="h-36 bg-transparent outline-none"
      onClick={() => setOpen(!open)}
      style={{
        perspective: '100rem',
      }}
      ref={cardRef}
    >
      <div
        className="relative w-full h-full transition-transform"
        style={{
          transform: open ? 'rotateY(0.5turn)' : '',
          transformStyle: 'preserve-3d',
        }}
      >
        <div className="bg-green-500 rounded absolute w-full h-full flex flex-col items-center justify-center" style={{ backfaceVisibility: 'hidden' }}>
          <p>{`${subject} ${catalogNumber}`}</p>
          <p>
            {title}
          </p>
        </div>
        <div className="bg-blue-500 rounded absolute w-full h-full flex flex-col items-center justify-center" style={{ transform: 'rotateY(0.5turn)', backfaceVisibility: 'hidden' }}>
          {catalogNumber}
        </div>
      </div>
    </button>
  );
};

const YearSchedule = function ({ mySchedule }: { mySchedule: Course[] }) {
  const startYear = 2021;
  return (
    <div className="h-full relative border-black border-2 w-full overflow-x-scroll">
      <div className="grid grid-cols-8 min-w-max h-full">
        {[...new Array(5)].flatMap((_, i) => [
          { year: startYear + i, season: 'Spring' },
          { year: startYear + i, season: 'Fall' },
        ])
          .slice(1, -1) // get rid of first and last since of mismatch
          .map(({ year, season }, i) => (
            <div key={year + season} className={`${i % 2 === 0 ? 'bg-gray-300' : 'bg-gray-100'} h-full p-2 text-center w-48`}>
              <h1 className="mb-2 text-lg border-black border-b-2">
                {`${year} ${season}`}
              </h1>
              <div className="flex flex-col gap-4">
                {/* courses */}
                {mySchedule.filter((course) => {
                  const courseSeason = /Fall/i.test(course.IS_SCL_DESCR_IS_SCL_DESCRH) ? 'Fall' : 'Spring' as const;
                  const academicYear = parseInt(course.ACAD_YEAR, 10);
                  const courseYear = courseSeason === 'Fall' ? academicYear - 1 : academicYear;
                  return courseYear === year && courseSeason === season;
                }).map((course) => <CourseCard course={course} />)}
              </div>
            </div>
          ))}
      </div>
    </div>
  );
};

export default YearSchedule;
