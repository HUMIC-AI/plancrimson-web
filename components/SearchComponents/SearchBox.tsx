import { Disclosure } from '@headlessui/react';
import { FaTimes, FaBars, FaArrowsAltV } from 'react-icons/fa';
import { connectSearchBox } from 'react-instantsearch-dom';
import React, { Fragment } from 'react';
import type { SearchBoxProvided } from 'react-instantsearch-core';
import MEILI_ATTRIBUTES from '../../shared/meiliAttributes.json';
import Attribute from './Attribute';
import useSelectedScheduleContext from '../../src/context/selectedSchedule';
import ScheduleSelector from '../ScheduleSelector';
import { classNames } from '../../shared/util';
import { ATTRIBUTE_DESCRIPTIONS, Class } from '../../shared/apiTypes';
import Stats from './Stats';
import { useLgBreakpoint } from '../../src/hooks';
import useCardStyle from '../../src/context/cardStyle';

const AttributeMenu = function () {
  const isLg = useLgBreakpoint();

  return (
    <div className="relative lg:hidden">
      {!isLg && (
      <Disclosure as={Fragment}>
        {({ open }) => (
          <>
            <Disclosure.Button className="inset-y-0 right-0 flex items-center">
              {open
                ? <FaTimes className="w-5 h-5 text-gray-700" />
                : <FaBars className="w-5 h-5 text-gray-700" />}
            </Disclosure.Button>
            <Disclosure.Panel
              unmount={false}
              className="absolute z-20 mt-2 right-0 w-48 p-2 flex flex-col gap-2 bg-gray-800 rounded-md"
            >
              {MEILI_ATTRIBUTES.filterableAttributes.map((attr) => (
                <Attribute attribute={attr} key={attr} label={ATTRIBUTE_DESCRIPTIONS[attr as keyof Class] || attr} />
              ))}
            </Disclosure.Panel>
          </>
        )}
      </Disclosure>
      )}
    </div>
  );
};

export const SearchBoxComponent: React.FC<SearchBoxProvided> = function ({ currentRefinement, isSearchStalled, refine }) {
  const {
    schedules, selectSchedule, selectedSchedule,
  } = useSelectedScheduleContext();
  const { isExpanded, expand } = useCardStyle();

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-4">
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
            'appearance-none border rounded w-full py-2 px-3 text-gray-700',
            'focus:outline-none focus:shadow-lg shadow transition-shadow',
          )}
        />

        <div className="hidden sm:block">
          <ScheduleSelector
            schedules={schedules}
            selectSchedule={selectSchedule}
            selectedSchedule={selectedSchedule}
            direction="left"
          />
        </div>

        <button
          type="button"
          onClick={() => expand(!isExpanded)}
          className={classNames(
            isExpanded ? 'bg-white text-gray-800' : 'bg-gray-800 text-white',
            'rounded-full hover:opacity-50 p-1 border -ml-1',
          )}
        >
          <FaArrowsAltV />
        </button>

        <AttributeMenu />
      </div>

      <div className="sm:hidden flex items-center gap-2 justify-between">
        <Stats />
        <ScheduleSelector
          schedules={schedules}
          selectSchedule={selectSchedule}
          selectedSchedule={selectedSchedule}
          direction="left"
        />
      </div>
      {isSearchStalled && <p>Loading...</p>}
    </div>
  );
};

export default connectSearchBox(SearchBoxComponent);