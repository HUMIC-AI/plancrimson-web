import { Disclosure } from '@headlessui/react';
import { FaTimes, FaBars } from 'react-icons/fa';
import { connectSearchBox, connectStats } from 'react-instantsearch-core';
import { classNames } from '../../src/util';
import MeiliAttributes from '../../shared/meiliAttributes.json';
import Attribute from './Attribute';
import useSearchPageContext from '../../src/context/searchPage';
import ScheduleSelector from '../ScheduleSelector';
import SortBy from './SortBy';

const Stats = connectStats(({
  nbHits, processingTimeMS,
}) => (
  <div>
    <span>
      Time:
      {' '}
      {processingTimeMS}
      {' '}
      ms
    </span>
    <span className="ml-2">
      {nbHits}
      {' '}
      classes found
    </span>
  </div>
));

const SearchBox = connectSearchBox(({ currentRefinement, isSearchStalled, refine }) => {
  const {
    schedules, selectSchedule, selectedSchedule,
  } = useSearchPageContext();

  return (
    <div>
      <div className="flex items-center space-x-2">
        <input
          type="search"
          placeholder="Search courses"
          autoComplete="off"
          autoCapitalize="off"
          autoCorrect="off"
          spellCheck="false"
          value={currentRefinement}
          onChange={({ currentTarget }) => refine(currentTarget.value)}
          maxLength={512}
          required
          className={classNames(
            'appearance-none border rounded w-full py-2 px-3 text-gray-700',
            'focus:outline-none focus:shadow-lg shadow transition-shadow',
          )}
        />
        {/* <label htmlFor="enableHighlight">
          <input
            type="checkbox"
            name="enableHighlight"
            id="enableHighlight"
            checked={highlightEnabled}
            onClick={({ currentTarget }) => setHighlightEnabled(currentTarget.checked)}
          />
          <span className="ml-2">Highlight</span>
        </label> */}
        <ScheduleSelector
          schedules={schedules}
          selectSchedule={selectSchedule}
          selectedSchedule={selectedSchedule}
        />
        <Disclosure as="div" className="relative md:hidden">
          {({ open }) => (
            <>
              <Disclosure.Button className="inset-y-0 right-0 flex items-center">
                {open
                  ? <FaTimes className="w-5 h-5 ml-4 text-gray-700" />
                  : <FaBars className="w-5 h-5 ml-4 text-gray-700" />}
              </Disclosure.Button>
              <Disclosure.Panel
                unmount={false}
                className="absolute mt-2 right-0 w-48 p-2 flex flex-col gap-2 bg-gray-800 rounded-md"
              >
                {Object.entries(MeiliAttributes.filterableAttributes).map(([attr, label]) => (
                  <Attribute attribute={attr} key={attr} label={label} />
                ))}
              </Disclosure.Panel>
            </>
          )}
        </Disclosure>
      </div>
      <Stats />
      {/* <SortBy items={[
        { value: 'courses:CATALOG_NBR:asc', label: 'ascending catalog number' },
      ]}
      /> */}
      {isSearchStalled && <p className="mt-2">Loading...</p>}
    </div>
  );
});

export default SearchBox;
