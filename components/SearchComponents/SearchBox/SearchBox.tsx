import React from 'react';
import { connectSearchBox } from 'react-instantsearch-dom';
import useChosenScheduleContext from '@/src/context/selectedSchedule';
import { useAppSelector } from '@/src/utils/hooks';
import { Schedules } from '@/src/features';
import { sortSchedules } from '@/src/utils/utils';
import type { SearchBoxProvided } from 'react-instantsearch-core';
import ScheduleChooser from '../../ScheduleChooser';
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
          scheduleIds={sortSchedules(schedules).map((schedule) => schedule.id)}
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


export default function () {
  return (
    <ClientOrDemo
      connector={connectSearchBox<SearchBoxProps>}
      component={SearchBoxComponent}
    />
  );
}

