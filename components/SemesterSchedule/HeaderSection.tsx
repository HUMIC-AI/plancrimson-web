import React from 'react';
import { createEvents, EventAttributes } from 'ics';
import { downloadJson } from '@/src/utils/utils';
import { Schedule } from '@/src/types';
import AddCoursesButton from '../AddCoursesButton';

export function HeaderSection({ events, schedule }: { events: EventAttributes[]; schedule: Schedule; }) {
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
      <div className="flex items-center justify-center space-x-4 bg-black p-4 text-center text-white">
        <p className="text-xl font-bold">
          {schedule.title}
        </p>

        <p className="text-white">
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
          className="rounded-xl bg-gray-dark px-4 py-2 transition-colors hover:bg-white/60"
        >
          Export to ICS
        </button>
      </div>
      <p className="text-center">
        Make sure to double-check course times on
        {' '}
        <a href="https://my.harvard.edu/">my.harvard</a>
        .
      </p>
    </div>
  );
}
