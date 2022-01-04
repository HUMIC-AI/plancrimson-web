import React from 'react';
import { classNames } from '../../shared/util';
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
    <div className="sm:space-y-4">
      <ScheduleSelector
        schedules={schedules}
        selectSchedule={selectSchedule}
        selectedSchedule={selectedSchedule}
        direction="center"
      />

      <form onSubmit={newSemester} className="sm:rounded-lg sm:max-w-md mx-auto p-2 bg-gray-300 flex flex-col sm:flex-row flex-wrap gap-2">
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
          className="focus:ring-blue-700 sm:max-w-xs rounded py-2 px-3 flex-shrink"
        />
        <select name="season" className="rounded py-2 pl-2 pr-6 flex-1">
          {['Spring', 'Fall'].map((season) => (
            <option key={season} value={season}>
              {season}
            </option>
          ))}
        </select>
        <button type="submit" className={classNames('flex-1 py-2 px-3 font-semibold hover-blue min-w-max')}>
          Add new schedule
        </button>
      </form>

      <Calendar
        classes={selectedSchedule
          ? selectedSchedule.classes.map(({ classId }) => getClass(classId))
          : []}
      />

      <p className="text-center my-4 sm:my-0">Export functionality coming soon!</p>
    </div>
  );
};

export default SemesterSchedule;
