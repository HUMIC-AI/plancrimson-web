import React, { useMemo } from 'react';
import useUserData from '../../src/context/userData';
import { Season } from '../../src/firestoreTypes';
import { useClassCache } from '../../src/hooks';
import { getAllClassIds, getSchedulesBySemester } from '../../src/util';
import ScheduleSelector from '../ScheduleSelector';
import CourseCard, { DragStatus } from './CourseCard';

export type SelectedSchedules = Record<string, string>;

type Props = {
  selectedSchedules: SelectedSchedules;
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

  let containerStyles = 'p-2 text-center flex-1 rounded-xl shadow-lg ';
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
        // eslint-disable-next-line no-param-reassign
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
        {selectedSchedule.classes.map(({ classId: id }) => (classCache[id] ? (
          <CourseCard
            key={id}
            course={classCache[id]}
            scheduleId={selectedScheduleId}
            setDragStatus={setDragStatus}
          />
        ) : (
          <div>
            Could not load data for
            {' '}
            {id}
          </div>
        )))}
      </div>
    </div>
  );
};

export default SemesterDisplay;
