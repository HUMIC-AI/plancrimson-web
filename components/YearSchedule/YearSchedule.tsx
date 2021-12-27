/* eslint-disable no-param-reassign */
import React, { useState } from 'react';
import useUserData from '../../src/context/userData';
import {
  getAllSemesters,
} from '../../src/util';
import { DragStatus } from './CourseCard';
import SemesterDisplay, { SelectedSchedules } from './SemesterDisplay';

const YearSchedule: React.FC = function () {
  const [dragStatus, setDragStatus] = useState<DragStatus>({
    dragging: false,
  });
  // selectedSchedules maps year + season to scheduleId
  const [selectedSchedules, setSelectedSchedules] = useState<SelectedSchedules>({});
  const { data } = useUserData();

  return (
    <div className="overflow-scroll w-full">
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
