/* eslint-disable no-param-reassign */
import React, { createRef, useState } from 'react';
import { Course } from '../src/types';
import { filterBySemester, getSemesters, ScheduleEntry } from './Course';

const CourseCard = function ({ course }: { course: Course }) {
  const {
    SUBJECT: subject,
    CATALOG_NBR: catalogNumber,
    IS_SCL_DESCR100: title,
    IS_SCL_MEETING_PAT: schedule,
  } = course;
  const [open, setOpen] = useState(false);
  const cardRef = createRef<HTMLButtonElement>();

  return (
    <button
      type="button"
      className="h-36 bg-transparent outline-none"
      onClick={() => setOpen(!open)}
      style={{
        perspective: '100rem',
      }}
      ref={cardRef}
      draggable
      onDragStart={(ev) => {
        ev.dataTransfer.setData('text/plain', course.Key);
        ev.dataTransfer.dropEffect = 'move';
      }}
    >
      <div
        className="relative w-full h-full transition-transform"
        style={{
          transform: open ? 'rotateY(0.5turn)' : '',
          transformStyle: 'preserve-3d',
        }}
      >
        <div className="bg-green-500 rounded absolute w-full h-full flex flex-col items-center justify-center" style={{ backfaceVisibility: 'hidden' }}>
          <p>{`${subject}${catalogNumber}`}</p>
          <div>
            <p>
              {title}
            </p>
            <p>
              {schedule}
            </p>
          </div>
        </div>
        <div className="bg-blue-500 rounded absolute w-full h-full flex flex-col items-center justify-center" style={{ transform: 'rotateY(0.5turn)', backfaceVisibility: 'hidden' }}>
          {`${subject}${catalogNumber}`}
        </div>
      </div>
    </button>
  );
};

const YearSchedule = function ({ mySchedule, setMySchedule }: {
  mySchedule: Array<ScheduleEntry>,
  setMySchedule: React.Dispatch<React.SetStateAction<Array<ScheduleEntry>>>
}) {
  const startYear = 2021;
  return (
    <div className="overflow-y-scroll w-full border-black border-2">
      <div className="p-4">
        Total courses:
        {' '}
        {mySchedule.length}
        /32
      </div>
      <div className="relative w-full overflow-x-scroll">
        <div className="grid grid-cols-8 min-w-max h-full">
          {getSemesters(startYear).map(({ year, season }, i) => (
            <div
              key={year + season}
              className={`${i % 2 === 0 ? 'bg-gray-300' : 'bg-gray-100'} h-full p-2 text-center w-48`}
              onDragOver={(ev) => {
                ev.preventDefault();
                ev.dataTransfer.dropEffect = 'move';
              }}
              onDrop={(ev) => {
                ev.preventDefault();
                setMySchedule((prev) => {
                  const courseKey = ev.dataTransfer.getData('text/plain');
                  const idx = prev.findIndex(({ course }) => course.Key === courseKey);
                  const ret = prev.slice();
                  const [{ course }] = ret.splice(idx, 1);
                  ret.push({ year, season, course });
                  return ret;
                });
              }}
            >
              <h1 className="mb-2 text-lg border-black border-b-2">
                {`${year} ${season}`}
              </h1>
              <div className="flex flex-col gap-4">
                {filterBySemester(mySchedule, year, season)
                  .map(({ course }) => <CourseCard key={course.Key} course={course} />)}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default YearSchedule;
