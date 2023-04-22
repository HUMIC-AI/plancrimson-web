import { FaAngleDoubleRight } from 'react-icons/fa';
import React from 'react';
import { connectSearchBox } from 'react-instantsearch-dom';
import useChosenScheduleContext from '@/src/context/selectedSchedule';
import { useAppDispatch, useAppSelector, useBreakpoint } from '@/src/hooks';
import { Auth, Planner, Schedules } from '@/src/features';
import { sortSchedules, classNames, breakpoints } from '@/src/utils';
import type { SearchBoxProvided } from 'react-instantsearch-core';
import ScheduleChooser from '../../ScheduleChooser';
import Stats, { StatsComponent } from '../Stats';
import StateResults, { StateResultsComponent } from '../StateResults';
import { alertSignIn } from './searchUtils';
import { AttributeMenuDropdown } from './AttributeMenuDropdown';


type SearchBoxProps = SearchBoxProvided & { scheduleChooser?: boolean };

/**
 * The main search bar that goes at the top of the search page. See {@link SearchBar} below.
 */
export function SearchBoxComponent({ scheduleChooser = true, ...props }: SearchBoxProps) {
  const schedules = useAppSelector(Schedules.selectSchedules);
  const { chooseSchedule: selectSchedule, chosenScheduleId: selectedSchedule } = useChosenScheduleContext();

  return (
    <div className="flex flex-col items-start space-y-4">
      <div className="flex w-full space-x-4">
        <SearchBar {...props} scheduleChooser={scheduleChooser} />
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


export function SearchBoxDemo() {
  return (
    <SearchBoxComponent
      isSearchStalled={false}
      refine={alertSignIn}
      currentRefinement="Search now"
    />
  );
}


export default connectSearchBox<SearchBoxProps>(SearchBoxComponent);


function SearchBar({
  currentRefinement,
  refine,
  isSearchStalled,
  scheduleChooser = true,
}: SearchBoxProps) {
  const dispatch = useAppDispatch();
  const schedules = useAppSelector(Schedules.selectSchedules);
  const uid = Auth.useAuthProperty('uid');
  const showAttributes = useAppSelector(Planner.selectShowAttributes);
  const isLg = useBreakpoint(breakpoints.lg);
  const { chooseSchedule, chosenScheduleId } = useChosenScheduleContext();

  return (
    <div className="flex w-full flex-col space-y-1">
      {/* box containing search bar and attribute menu */}
      <div className="flex items-center space-x-4">
        {!showAttributes && (
        <button
          type="button"
          onClick={() => dispatch(Planner.setShowAttributes(true))}
          className="interactive hidden lg:block"
        >
          <FaAngleDoubleRight />
        </button>
        )}

        <input
          type="search"
          placeholder="Search classes"
          autoComplete="off"
          autoCapitalize="off"
          autoCorrect="off"
          spellCheck="false"
          value={currentRefinement}
          onChange={({ currentTarget }) => refine(currentTarget.value)}
          maxLength={512}
          required
          className={classNames(
            'flex-1 appearance-none border rounded w-full py-2 px-3 text-gray-dark',
            'focus:outline-none focus:shadow-lg shadow transition-shadow',
          )}
        />

        {scheduleChooser && (
        <div className="hidden sm:block">
          <ScheduleChooser
            scheduleIds={sortSchedules(schedules).map((schedule) => schedule.id)}
            handleChooseSchedule={chooseSchedule}
            chosenScheduleId={chosenScheduleId}
            direction="left"
            showDropdown
          />
        </div>
        )}

        {!isLg && <AttributeMenuDropdown />}
      </div>
      {/* end box containing search bar and attribute menu */}

      {/* caption text */}
      <div className="flex flex-wrap space-x-2 text-xs text-gray-light">
        {uid ? (
          <>
            {isSearchStalled && <span>Loading...</span>}
            <Stats />
            <StateResults />
          </>
        ) : (
          <>
            <StatsComponent nbHits={20000} processingTimeMS={50} />
            <StateResultsComponent searchState={{}} />
          </>
        )}
      </div>
      {/* end caption text */}
    </div>
  );
}


