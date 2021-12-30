import Link from 'next/link';
import React, { useMemo } from 'react';
import { getAllClassIds } from '../../shared/util';
import useUserData from '../../src/context/userData';
import { Schedule } from '../../shared/firestoreTypes';
import { useClassCache } from '../../src/hooks';
import ScheduleSelector from '../ScheduleSelector';
import CourseCard, { DragStatus } from './CourseCard';

export type SelectedSchedules = Record<string, Schedule>;

type Props = {
  title: string;
  schedules: Schedule[];
  selectedSchedule: Schedule;
  selectSchedule: React.Dispatch<Schedule>;

  highlightedClasses: string[];
  dragStatus: DragStatus;
  setDragStatus: React.Dispatch<React.SetStateAction<DragStatus>>;
};

const SemesterDisplay: React.FC<Props> = function ({
  title, schedules, selectedSchedule, selectSchedule, highlightedClasses, dragStatus, setDragStatus,
}) {
  const { data, addCourses, removeCourses } = useUserData();
  const classIds = useMemo(() => getAllClassIds(data), [data]);
  const { classCache } = useClassCache(classIds);

  let containerStyles = 'p-4 text-center flex-1 rounded-xl shadow-lg w-48 ';
  if (dragStatus.dragging) {
    containerStyles += (dragStatus.data.originScheduleId === selectedSchedule.id
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
          addCourses({ classId, scheduleId: selectedSchedule.id });
          removeCourses({ classId, scheduleId: originScheduleId });
        }
        setDragStatus({ dragging: false });
      }}
    >
      <h1 className="mb-2 py-2 text-lg border-black border-b-2">
        {title}
      </h1>

      <ScheduleSelector
        schedules={schedules}
        selectedSchedule={selectedSchedule}
        selectSchedule={selectSchedule}
      />

      {selectedSchedule && (
      <Link href={`/semester?selected=${encodeURIComponent(selectedSchedule.id)}`}>
        {/* eslint-disable-next-line jsx-a11y/anchor-is-valid */}
        <a className="inline-block text-sm py-2 px-3 rounded mt-2 bg-blue-300 hover:bg-blue-700">Show in semester view</a>
      </Link>
      )}

      <div className="flex flex-col items-center gap-4 mt-2">
        {selectedSchedule.classes.map(({ classId: id }) => (
          id && classCache[id]
            ? (
              <CourseCard
                key={id}
                course={classCache[id]}
                highlight={highlightedClasses.includes(id)}
                scheduleId={selectedSchedule.id}
                setDragStatus={setDragStatus}
              />
            )
            : (
              <div key={id}>
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
