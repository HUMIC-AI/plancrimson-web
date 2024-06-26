import React from 'react';
import { connectSearchBox } from 'react-instantsearch-dom';
import { useChosenSchedule } from '@/src/context/ScheduleProvider';
import { useAppSelector } from '@/src/utils/hooks';
import { sortSchedulesBySemester } from '@/src/utils/schedules';
import { Schedules } from '@/src/features';
import type { SearchBoxProvided } from 'react-instantsearch-core';
import ScheduleChooser from '../../ScheduleChooser/ScheduleChooser';
import { alertSignIn } from './searchUtils';
import { SearchBar } from './SearchBar';
import useClientOrDemo from '../ClientOrDemo';

// eslint-disable-next-line react/no-unused-prop-types
type Exposed = {
  scheduleChooser?: boolean;
  showSmallAttributeMenu?: boolean;
  showStats?: boolean;
};

type SearchBoxProps = SearchBoxProvided & Exposed;

/**
 * The main search bar that goes at the top of the search page. See {@link SearchBar} below.
 */
function SearchBoxComponent({
  scheduleChooser = true,
  isSearchStalled = false,
  refine = alertSignIn,
  currentRefinement = 'Search now',
  showSmallAttributeMenu,
  showStats,
}: SearchBoxProps) {
  const schedules = useAppSelector(Schedules.selectSchedules);
  const { id } = useChosenSchedule();

  return (
    <div className="flex flex-col items-start space-y-4">
      <div className="flex w-full space-x-4">
        <SearchBar
          scheduleChooser={scheduleChooser}
          isSearchStalled={isSearchStalled}
          refine={refine}
          currentRefinement={currentRefinement}
          showSmallAttributeMenu={showSmallAttributeMenu}
          showStats={showStats}
        />
      </div>

      {scheduleChooser && (
      <div className="relative sm:hidden">
        <ScheduleChooser
          scheduleIds={sortSchedulesBySemester(schedules).map((schedule) => schedule.id)}
          chosenScheduleId={id}
          direction="right"
          showDropdown
        />
      </div>
      )}
    </div>
  );
}

export default function SearchBox(props: Exposed) {
  const Component = useClientOrDemo<SearchBoxProvided, Exposed>(
    connectSearchBox as any,
    SearchBoxComponent,
  );
  return <Component {...props} />;
}

