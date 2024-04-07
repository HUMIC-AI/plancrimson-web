import React from 'react';
import { connectSearchBox } from 'react-instantsearch-dom';
import useChosenScheduleContext from '@/src/context/selectedSchedule';
import { useAppSelector } from '@/src/utils/hooks';
import { sortSchedulesBySemester } from '@/src/utils/schedules';
import { Schedules } from '@/src/features';
import type { SearchBoxExposed, SearchBoxProvided } from 'react-instantsearch-core';
import ScheduleChooser from '../../ScheduleChooser/ScheduleChooser';
import { alertSignIn } from './searchUtils';
import { SearchBar } from './SearchBar';
import ClientOrDemo from '../ClientOrDemo';


type SearchBoxProps = SearchBoxProvided & { scheduleChooser?: boolean };

/**
 * The main search bar that goes at the top of the search page. See {@link SearchBar} below.
 */
function SearchBoxComponent({
  scheduleChooser = true,
  isSearchStalled = false,
  refine = alertSignIn,
  currentRefinement = 'Search now',
}: SearchBoxProps) {
  const schedules = useAppSelector(Schedules.selectSchedules);
  const { chooseSchedule: selectSchedule, chosenScheduleId: selectedSchedule } = useChosenScheduleContext();

  return (
    <div className="flex flex-col items-start space-y-4">
      <div className="flex w-full space-x-4">
        <SearchBar
          scheduleChooser={scheduleChooser}
          isSearchStalled={isSearchStalled}
          refine={refine}
          currentRefinement={currentRefinement}
        />
      </div>

      {scheduleChooser && (
      <div className="relative sm:hidden">
        <ScheduleChooser
          scheduleIds={sortSchedulesBySemester(schedules).map((schedule) => schedule.id)}
          handleChooseSchedule={selectSchedule}
          chosenScheduleId={selectedSchedule}
          direction="right"
          showDropdown
        />
      </div>
      )}
    </div>
  );
}


// eslint-disable-next-line react/no-unused-prop-types
export default function (props: SearchBoxExposed & { scheduleChooser?: boolean }) {
  return (
    <ClientOrDemo
      connector={connectSearchBox<SearchBoxProps>}
      Component={SearchBoxComponent}
      componentProps={props}
    />
  );
}

