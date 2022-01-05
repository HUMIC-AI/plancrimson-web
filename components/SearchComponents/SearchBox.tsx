import { Disclosure } from '@headlessui/react';
import { FaTimes, FaBars } from 'react-icons/fa';
import { connectSearchBox } from 'react-instantsearch-dom';
import React, { Fragment } from 'react';
import type { SearchBoxProvided } from 'react-instantsearch-core';
import MEILI_ATTRIBUTES from '../../shared/meiliAttributes.json';
import Attribute from './Attribute';
import useSelectedScheduleContext from '../../src/context/selectedSchedule';
import ScheduleSelector from '../ScheduleSelector';
import { classNames } from '../../shared/util';
import { ATTRIBUTE_DESCRIPTIONS, Class } from '../../shared/apiTypes';
import Stats, { StatsComponent } from './Stats';
import { useLgBreakpoint } from '../../src/hooks';
import useUser from '../../src/context/user';
import StateResults, { StateResultsComponent } from './StateResults';

const AttributeMenu = function () {
  const isLg = useLgBreakpoint();

  return (
    <div className="relative lg:hidden">
      {!isLg && (
        <Disclosure as={Fragment}>
          {({ open }) => (
            <>
              <Disclosure.Button className="inset-y-0 right-0 flex items-center">
                {open ? (
                  <FaTimes className="w-5 h-5 text-gray-700" />
                ) : (
                  <FaBars className="w-5 h-5 text-gray-700" />
                )}
              </Disclosure.Button>
              <Disclosure.Panel
                unmount={false}
                className={classNames(
                  'absolute z-20 mt-2 right-0 w-48 p-2 from-gray-800 to-blue-900 bg-gradient-to-br rounded-md',
                  'flex flex-col space-y-2',
                )}
              >
                {MEILI_ATTRIBUTES.filterableAttributes.map((attr) => (
                  <Attribute
                    attribute={attr}
                    key={attr}
                    label={ATTRIBUTE_DESCRIPTIONS[attr as keyof Class] || attr}
                  />
                ))}
                <span className="text-white text-xs p-1">
                  If filters are not showing up, clear your search and try
                  again.
                </span>
              </Disclosure.Panel>
            </>
          )}
        </Disclosure>
      )}
    </div>
  );
};

const SearchBar: React.FC<SearchBoxProvided> = function ({
  currentRefinement,
  refine,
  isSearchStalled,
}) {
  const { user } = useUser();
  const { schedules, selectSchedule, selectedSchedule } = useSelectedScheduleContext();

  return (
    <div className="flex flex-col space-y-1 w-full">
      {/* box containing search bar and attribute menu */}
      <div className="flex items-center space-x-4">
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
            'flex-1 appearance-none border rounded w-full py-2 px-3 text-gray-700',
            'focus:outline-none focus:shadow-lg shadow transition-shadow',
          )}
        />
        <div className="hidden sm:block">
          <ScheduleSelector
            schedules={schedules}
            selectSchedule={selectSchedule}
            selectedSchedule={selectedSchedule}
            direction="left"
            showTerm
          />
        </div>
        <AttributeMenu />
      </div>
      {/* end box containing search bar and attribute menu */}

      {/* caption text */}
      <div className="flex flex-wrap text-xs space-x-2 text-gray-400">
        {user ? (
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
};

export const SearchBoxComponent: React.FC<SearchBoxProvided> = function (
  props,
) {
  const { schedules, selectSchedule, selectedSchedule } = useSelectedScheduleContext();

  return (
    <div className="flex flex-col space-y-4 items-start">
      <div className="flex space-x-4 w-full">
        <SearchBar {...props} />
      </div>

      <div className="sm:hidden relative">
        <ScheduleSelector
          schedules={schedules}
          selectSchedule={selectSchedule}
          selectedSchedule={selectedSchedule}
          direction="right"
          showTerm
        />
      </div>
    </div>
  );
};

export default connectSearchBox(SearchBoxComponent);
