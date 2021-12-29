/* eslint-disable no-param-reassign */
import React, { useEffect, useMemo, useState } from 'react';
import useUserData from '../../src/context/userData';
import { useClassCache } from '../../src/hooks';
import validateSchedules, { getReqs } from '../../src/schedules';
import basicRequirements from '../../src/schedules/cs/basic';
import { RequirementGroup } from '../../src/schedules/util';
import {
  getAllSemesters,
} from '../../src/util';
import { DragStatus } from './CourseCard';
import SemesterDisplay, { SelectedSchedules } from './SemesterDisplay';

const RequirementsDisplay: React.FC<{ requirements: RequirementGroup }> = function ({ requirements }) {
  return (
    <div>
      <h1>
        {requirements.groupId}
      </h1>

      {requirements.description && <p>{requirements.description}</p>}

      <ul className="list-decimal space-y-2">
        {requirements.requirements.map((req) => (
          ('groupId' in req)
            ? (
              <li key={req.groupId} className="ml-2">
                <RequirementsDisplay key={req.groupId} requirements={req} />
              </li>
            )
            : (
              <li key={req.id} className="ml-2">
                <h2>{req.id}</h2>
                <p>{req.description}</p>
              </li>
            )
        ))}
      </ul>
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
  const numbers = useMemo(() => (data.schedules ? Object.values(data.schedules).map((s) => s.classes.map((c) => c.classId)).flat() : []), [data]);
  const { classCache } = useClassCache(numbers);

  useEffect(() => {
    const asdf = validateSchedules(
      Object.values(selectedSchedules).map((scheduleId) => data.schedules[scheduleId]),
      getReqs(basicRequirements),
      data,
      classCache,
    );
  }, [selectedSchedules]);

  return (
    <div className="w-full">
      <div className="p-4">
        Total courses:
        {' '}
        {Object.values(selectedSchedules).reduce((acc, schedule) => acc + data.schedules[schedule].classes.length, 0)}
        /32
      </div>

      <div className="flex overflow-x-scroll">
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

      <RequirementsDisplay requirements={basicRequirements} />
    </div>
  );
};

export default YearSchedule;
