import React from 'react';
import { createEvents, EventAttributes } from 'ics';
import { downloadJson } from '@/src/utils/utils';
import AddCoursesButton from './AddCoursesButton';
import { SearchStateProvider, useDefaultSearchState } from '../../src/context/searchState';
import { AuthRequiredInstantSearchProvider } from '../Utils/AuthRequiredInstantSearchProvider';
import { WithMeili } from '../Layout/WithMeili';
import { Auth } from '../../src/features';
import SearchBox from '../SearchComponents/SearchBox/SearchBox';
import Hits from '../SearchComponents/Hits';
import { ScheduleSyncer } from '../Utils/ScheduleSyncer';
import { isOldSemester } from '../../src/lib';
import { useChosenSchedule } from '../../src/context/ScheduleProvider';
import { LoadingText } from '../Layout/LoadingPage';
import CourseCardStyleProvider from '../../src/context/CourseCardStyleProvider';

type Props = {
  events: (EventAttributes & { isSection?: string })[];
};

export function CalendarHeaderSection({ events }: Props) {
  const userId = Auth.useAuthProperty('uid');
  const { schedule } = useChosenSchedule();
  const defaultState = useDefaultSearchState(schedule);

  const indexName = isOldSemester(schedule) ? 'archive' : 'courses';

  return (
    <div className="relative md:flex md:w-min md:flex-col md:space-y-4 lg:w-full lg:max-w-md">
      <div className="relative flex flex-1 items-center justify-center space-x-4 text-center md:inset-y-0 md:flex-col md:space-x-0 md:space-y-2 md:overflow-hidden">
        {schedule ? (
          <>
            <p className="text-xl font-bold">
              {schedule.title}
            </p>

            <p>
              {schedule.year}
              {' '}
              {schedule.season}
            </p>

            <button
              type="button"
              onClick={() => exportScheduleToIcs(events)}
              className="button secondary"
            >
              Export to ICS
            </button>

            <div className="md:hidden">
              <AddCoursesButton schedule={schedule}>
                Add courses
              </AddCoursesButton>
            </div>
          </>
        ) : <LoadingText />}

        <p className="w-48 text-center text-xs">
          Make sure to double-check course times on
          {' '}
          <a href="https://my.harvard.edu/" className="interactive">my.harvard</a>
          .
        </p>

        <div className="relative md:flex-1 md:overflow-auto">
          <WithMeili userId={userId}>
            {userId && <ScheduleSyncer userId={userId} />}

            <CourseCardStyleProvider columns={1}>
              <SearchStateProvider defaultState={defaultState} ignoreUrl>
                <AuthRequiredInstantSearchProvider indexName={indexName} hitsPerPage={4}>
                  <SearchBox scheduleChooser={false} showSmallAttributeMenu />
                  <div className="md:mt-4">
                    <Hits />
                  </div>
                </AuthRequiredInstantSearchProvider>
              </SearchStateProvider>
            </CourseCardStyleProvider>
          </WithMeili>
        </div>
      </div>
    </div>
  );
}


function exportScheduleToIcs(events: Props['events']) {
  const { error, value } = createEvents(events.map(({ isSection, ...event }) => ({
    ...event,
  })));
  if (error) {
    console.error(error);
    alert('There was an error exporting your schedule. Please try again later.');
  } else if (value) {
    downloadJson('schedule', value, 'ics');
  }
}
