import { Disclosure } from '@headlessui/react';
import { FaTimes, FaBars, FaAngleDoubleRight } from 'react-icons/fa';
import { connectSearchBox } from 'react-instantsearch-dom';
import React, { Fragment } from 'react';
import type { SearchBoxProvided } from 'react-instantsearch-core';
import MEILI_ATTRIBUTES, {
  ATTRIBUTE_DESCRIPTIONS, breakpoints, classNames, sortSchedules,
} from 'plancrimson-utils';
import type { Class } from 'plancrimson-utils';
import Attribute from './Attribute';
import ScheduleChooser from '../ScheduleSelector';
import Stats, { StatsComponent } from './Stats';
import StateResults, { StateResultsComponent } from './StateResults';
import { alertSignIn } from './searchUtils';
import useChosenScheduleContext from '@/src/context/selectedSchedule';
import { useAppDispatch, useAppSelector, useBreakpoint } from '@/src/hooks';
import { Auth, Planner, Schedules } from '@/src/features';


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


function AttributeMenuDropdown() {
  return (
    <div className="relative">
      <Disclosure as={Fragment}>
        {({ open }) => (
          <>
            <Disclosure.Button className="inset-y-0 right-0 flex items-center">
              {open ? (
                <FaTimes className="h-5 w-5 text-gray-dark" />
              ) : (
                <FaBars className="h-5 w-5 text-gray-dark" />
              )}
            </Disclosure.Button>
            <Disclosure.Panel
              unmount={false}
              className={classNames(
                'absolute z-20 mt-2 right-0 w-48 p-2 dark-gradient rounded-md',
                'flex flex-col space-y-2',
              )}
            >
              {MEILI_ATTRIBUTES.filterableAttributes.map((attr) => (
                <Attribute
                  attribute={attr}
                  key={attr}
                  label={ATTRIBUTE_DESCRIPTIONS[attr as keyof Class] || attr}
                  showSubjectColor={false}
                />
              ))}
              <span className="p-1 text-xs text-white">
                If filters are not showing up, clear your search and try
                again.
              </span>
            </Disclosure.Panel>
          </>
        )}
      </Disclosure>
    </div>
  );
}
