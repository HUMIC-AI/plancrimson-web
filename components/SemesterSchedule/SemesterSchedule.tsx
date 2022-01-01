import React from 'react';
import useClassCache from '../../src/context/classCache';
import useSelectedScheduleContext from '../../src/context/selectedSchedule';
import useUserData from '../../src/context/userData';
import ScheduleSelector from '../ScheduleSelector';
import Calendar from './Calendar';

const SemesterSchedule: React.FC = function () {
  const { schedules, selectSchedule, selectedSchedule } = useSelectedScheduleContext();
  const { data, createSchedule } = useUserData();
  const getClass = useClassCache(data);

  const newSemester: React.FormEventHandler<HTMLFormElement> = (ev) => {
    ev.preventDefault();
    const fields = ev.currentTarget.elements as any;
    createSchedule(fields.semesterId.value, fields.year.value, fields.season.value);
  };

  return (
    <div>
      <div className="space-y-2 mt-2">
        <ScheduleSelector
          schedules={schedules}
          selectSchedule={selectSchedule}
          selectedSchedule={selectedSchedule}
          direction="right"
        />

        <form onSubmit={newSemester} className="rounded p-2 bg-gray-300 flex flex-col sm:flex-row flex-wrap gap-2">
          <input
            type="text"
            name="semesterId"
            placeholder="Schedule name"
            className="focus:ring-blue-700 rounded py-2 px-3 flex-1"
          />
          <input
            type="number"
            name="year"
            placeholder="Year"
            className="focus:ring-blue-700 max-w-xs rounded py-2 px-3 flex-shrink"
          />
          <select name="season" className="rounded py-2 pl-2 pr-6 flex-1">
            {['Spring', 'Fall'].map((season) => (
              <option key={season} value={season}>
                {season}
              </option>
            ))}
          </select>
          <button type="submit" className="flex-1 py-2 px-3 font-semibold rounded bg-blue-300 hover:bg-blue-500 min-w-max">
            Add new schedule
          </button>
        </form>

        <Calendar
          classes={selectedSchedule
            ? selectedSchedule.classes.map(({ classId }) => getClass(classId))
            : []}
        />
      </div>
    </div>
  );
};

export default SemesterSchedule;
