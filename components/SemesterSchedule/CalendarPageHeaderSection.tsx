import React from 'react';
import { createEvents, EventAttributes } from 'ics';
import { downloadJson } from '@/src/utils/utils';
import { BaseSchedule } from '@/src/types';
import AddCoursesButton from '../AddCoursesButton';

type Props = {
  events: EventAttributes[];
  schedule: BaseSchedule;
};

export function CalendarHeaderSection({ events, schedule }: Props) {
  function handleExport() {
    const { error, value } = createEvents(events);
    if (error) {
      console.error(error);
      alert('There was an error exporting your schedule. Please try again later.');
    } else if (value) {
      downloadJson('schedule', value, 'ics');
    }
  }

  return (
    <div>
      <div className="flex items-center justify-center space-x-4 p-4 text-center">
        <p className="text-xl font-bold">
          {schedule.title}
        </p>

        <p>
          {schedule.year}
          {' '}
          {schedule.season}
        </p>

        <AddCoursesButton schedule={schedule}>
          Add courses
        </AddCoursesButton>

        <button
          type="button"
          onClick={handleExport}
          className="interactive rounded-xl bg-gray-secondary px-4 py-2"
        >
          Export to ICS
        </button>
      </div>
      <p className="text-center">
        Make sure to double-check course times on
        {' '}
        <a href="https://my.harvard.edu/" className="interactive">my.harvard</a>
        .
      </p>
    </div>
  );
}
