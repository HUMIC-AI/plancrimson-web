/* eslint-disable no-param-reassign */
import React, { createRef, useState } from 'react';
import { Course } from '../src/types';
import { useUser } from '../src/userContext';
import {
  filterBySemester, getSemesters, getYearAndSeason,
} from './Course';

type DragStatus = {
  dragging: false;
} | {
  dragging: true;
  data: { key: string; year: number; season: string; }
};

const CourseCard: React.FC<{
  course: Course, setDragStatus: React.Dispatch<React.SetStateAction<DragStatus>>
}> = function ({ course, setDragStatus }) {
  const {
    SUBJECT: subject,
    CATALOG_NBR: catalogNumber,
    IS_SCL_DESCR100: title,
    IS_SCL_MEETING_PAT: schedule,
    IS_SCL_TIME_START: startTime,
    IS_SCL_TIME_END: endTime,
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
        ev.dataTransfer.dropEffect = 'move';
        setDragStatus({ dragging: true, data: { key: course.Key, ...getYearAndSeason(course) } });
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
              {`${schedule} ${startTime}–${endTime}`}
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

const YearSchedule: React.FC = function () {
  const startYear = 2021;
  const [dragStatus, setDragStatus] = useState<DragStatus>({
    dragging: false,
  });
  const { schedule, setSchedule, courseCache } = useUser();

  return (
    <div className="overflow-y-scroll w-full border-black border-2">
      <div className="p-4">
        Total courses:
        {' '}
        {schedule.length}
        /32
      </div>
      <div className="relative w-full overflow-x-scroll">
        <div className="grid grid-cols-8 min-w-max h-full">
          {getSemesters(startYear).map(({ year, season }, i) => (
            <div
              key={year + season}
              // eslint-disable-next-line no-nested-ternary
              className={`${dragStatus.dragging ? (dragStatus.data.season === season
                ? 'bg-blue-300'
                : 'bg-gray-300 cursor-not-allowed')
                : (i % 2 === 0 ? 'bg-gray-300' : 'bg-gray-100')} h-full p-2 text-center w-48`}
              onDragOver={(ev) => {
                ev.preventDefault();
                ev.dataTransfer.dropEffect = 'move';
              }}
              onDrop={(ev) => {
                ev.preventDefault();
                setDragStatus({ dragging: false });
                if (dragStatus.dragging && dragStatus.data.season === season) {
                  setSchedule((prev) => {
                    const idx = prev.findIndex(({ course }) => course === dragStatus.data.key);
                    const ret = prev.slice();
                    const [{ course }] = ret.splice(idx, 1);
                    ret.push({ year, season, course });
                    return ret;
                  });
                }
              }}
            >
              <h1 className="mb-2 text-lg border-black border-b-2">
                {`${year} ${season}`}
              </h1>
              <div className="flex flex-col gap-4">
                {filterBySemester(schedule, year, season)
                  .map(({ course }) => <CourseCard key={course} course={courseCache[course]} setDragStatus={setDragStatus} />)}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default YearSchedule;
