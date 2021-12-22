/* eslint-disable no-param-reassign */
import React, { createRef, useMemo, useState } from 'react';
import { Season, useClassCache } from '../src/schedules';
import { Class } from '../src/types';
import {
  getAllSemesters, useUserData, getClassId, getAllClassIds, getSchedulesBySemester,
} from '../src/userContext';
import ScheduleSelector from './ScheduleSelector';

type DragStatus = {
  dragging: false;
} | {
  dragging: true;
  data: {
    classId: string;
    originScheduleId: string;
  };
};

const CourseCard: React.FC<{
  course: Class, setDragStatus: React.Dispatch<React.SetStateAction<DragStatus>>, scheduleId: string
}> = function ({ course, setDragStatus, scheduleId }) {
  const {
    SUBJECT: subject,
    CATALOG_NBR: catalogNumber,
    IS_SCL_DESCR100: title,
    IS_SCL_MEETING_PAT: schedule,
    IS_SCL_TIME_START: startTime,
    IS_SCL_TIME_END: endTime,
    HU_STRM_CLASSNBR: classKey,
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
        setDragStatus({
          dragging: true,
          data: { classId: getClassId(course), originScheduleId: scheduleId },
        });
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
          <br />
          {classKey}
        </div>
      </div>
    </button>
  );
};

type SelectedSchedules = Record<string, string>;

type Props = { selectedSchedules: SelectedSchedules;
  setSelectedSchedules: React.Dispatch<React.SetStateAction<SelectedSchedules>> ;
  year: number;
  season: Season;
  dragStatus: DragStatus;
  setDragStatus: React.Dispatch<React.SetStateAction<DragStatus>>;
};

const SemesterDisplay: React.FC<Props> = function ({
  selectedSchedules, setSelectedSchedules, year, season, dragStatus, setDragStatus,
}) {
  const { data, addCourses, removeCourses } = useUserData();
  const classIds = useMemo(() => getAllClassIds(data), [data]);
  const { classCache } = useClassCache(classIds);

  const selectedScheduleId = selectedSchedules[year + season]
  || Object.values(data.schedules).find((schedule) => schedule.year === year && schedule.season === season)!.id;
  const selectedSchedule = data.schedules[selectedScheduleId];

  console.log({ classCache });

  let containerStyles = 'h-full p-2 text-center flex-1 max-w-xs ';
  if (dragStatus.dragging) {
    containerStyles += (dragStatus.data.originScheduleId === selectedScheduleId
      ? 'bg-blue-300'
      : 'bg-gray-300 cursor-not-allowed');
  } else {
    containerStyles += 'even:bg-gray-300 odd:bg-gray-100';
  }

  return (
    <div
      className={containerStyles}
      onDragOver={(ev) => {
        ev.preventDefault();
        ev.dataTransfer.dropEffect = 'move';
      }}
      onDrop={(ev) => {
        ev.preventDefault();
        if (dragStatus.dragging) {
          const { classId, originScheduleId } = dragStatus.data;
          addCourses({ classId, scheduleId: selectedScheduleId });
          removeCourses({ classId, scheduleId: originScheduleId });
        }
        setDragStatus({ dragging: false });
      }}
    >
      <h1 className="mb-2 py-2 text-lg border-black border-b-2">
        {`${year} ${season}`}
      </h1>

      <ScheduleSelector
        schedules={getSchedulesBySemester(data, year, season).map((schedule) => schedule.id)}
        selectedSchedule={selectedSchedule.id}
        selectSchedule={(val) => setSelectedSchedules((prev) => ({ ...prev, [year + season]: val }))}
      />

      <div className="flex flex-col gap-4 mt-2">
        {selectedSchedule.classes.map(({ id }) => classCache[id] && (
          <CourseCard
            key={id}
            course={classCache[id]}
            scheduleId={selectedScheduleId}
            setDragStatus={setDragStatus}
          />
        ))}
      </div>
    </div>
  );
};

const YearSchedule: React.FC = function () {
  const [dragStatus, setDragStatus] = useState<DragStatus>({
    dragging: false,
  });
  // selectedSchedules maps year + season to scheduleId
  const [selectedSchedules, setSelectedSchedules] = useState<SelectedSchedules>({});
  const { data } = useUserData();

  return (
    <div className="overflow-scroll w-full border-black border-2">
      <div className="p-4">
        Total courses:
        {' '}
        {Object.values(selectedSchedules).reduce((acc, schedule) => acc + data.schedules[schedule].classes.length, 0)}
        /32
      </div>
      <div className="relative w-full overflow-x-scroll">
        <div className="flex justify-center">
          {getAllSemesters(data).map(({ year, season }) => (
            <SemesterDisplay
              key={year + season}
              selectedSchedules={selectedSchedules}
              setSelectedSchedules={setSelectedSchedules}
              year={year}
              season={season}
              dragStatus={dragStatus}
              setDragStatus={setDragStatus}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default YearSchedule;
