import React, { useMemo } from 'react';
import { useClassCache } from '../../src/schedules';
import { getAllClassIds, useUserData } from '../../src/userContext';
import ScheduleSelector, { ScheduleSelectorProps } from '../ScheduleSelector';
import Calendar from './Calendar';

const SemesterSchedule: React.FC<ScheduleSelectorProps> = function ({ selectedSchedule, selectSchedule }) {
  const { data, createSchedule } = useUserData();
  const classIds = useMemo(() => getAllClassIds(data), [data]);
  const { classCache } = useClassCache(classIds);

  const newSemester: React.FormEventHandler<HTMLFormElement> = (ev) => {
    ev.preventDefault();
    const fields = ev.currentTarget.elements as any;
    createSchedule(fields.semesterId.value, fields.year.value, fields.season.value);
  };

  return (
    <div>
      <div className="space-y-2 mt-2">
        <ScheduleSelector
          schedules={Object.keys(data.schedules)}
          selectSchedule={selectSchedule}
          selectedSchedule={selectedSchedule}
        />

        <form onSubmit={newSemester} className="rounded p-2 bg-gray-300 flex flex-col sm:flex-row gap-2">
          <input
            type="text"
            name="semesterId"
            placeholder="Schedule name"
            className="focus:ring-blue-700 rounded pl-2"
          />
          <input
            type="number"
            name="year"
            placeholder="Year"
            className="focus:ring-blue-700 rounded pl-2"
          />
          <select name="season" className="rounded pl-2 pr-6">
            {['Summer', 'Spring', 'Fall'].map((season) => (
              <option key={season} value={season}>
                {season}
              </option>
            ))}
          </select>
          <button type="submit" className="py-2 px-3 font-semibold rounded bg-blue-300 hover:bg-blue-500">Add new schedule</button>
        </form>

        <Calendar
          classes={selectedSchedule
            ? data.schedules[selectedSchedule].classes.map(({ classId: id }) => classCache[id])
            : []}
        />
      </div>
    </div>
  );
};

export default SemesterSchedule;
