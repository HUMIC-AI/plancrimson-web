import { Disclosure } from '@headlessui/react';
import React, { useState } from 'react';
import { FaChevronDown } from 'react-icons/fa';
import { DayOfWeek, DAYS_OF_WEEK } from '../../shared/apiTypes';
import { classNames } from '../../shared/util';
import RefinementList from './RefinementList';

function compareItems(a: { label: string }, b: { label: string }) {
  if (a.label < b.label) return -1;
  if (b.label < a.label) return 1;
  return 0;
}

function compareWeekdays(a: { label: DayOfWeek }, b: { label: DayOfWeek }) {
  return DAYS_OF_WEEK.indexOf(a.label) - DAYS_OF_WEEK.indexOf(b.label);
}

const Attribute: React.FC<{ attribute: string; label: string }> = function ({ attribute, label }) {
  const [operator, setOperator] = useState<'and' | 'or'>('or');
  return (
    <Disclosure as="div">
      {({ open }) => (
        <>
          <Disclosure.Button className={classNames(
            'bg-white flex justify-between items-center w-full py-2 px-3',
            'text-sm text-left font-medium',
            open ? 'rounded-t' : 'rounded',
          )}
          >
            <h3 className="flex-1">{label}</h3>
            <span className="inline-flex items-center ml-4">
              <button
                type="button"
                onClick={(ev) => {
                  ev.stopPropagation();
                  setOperator(operator === 'and' ? 'or' : 'and');
                }}
                className="hover:font-semibold w-6 bg-gray-700 rounded text-white"
              >
                {operator}
              </button>
              <FaChevronDown className="w-5 h-5 ml-2" />
            </span>
          </Disclosure.Button>
          <Disclosure.Panel unmount={false}>
            <div className="p-2 origin-top-right bg-gray-300 rounded-b">
              <RefinementList
                attribute={attribute}
                operator={operator}
                showMore
                showMoreLimit={300}
                transformItems={(items) => (attribute === 'DAY_OF_WEEK'
                  ? items.sort(compareWeekdays)
                  : items.sort(compareItems))}
              />
            </div>
          </Disclosure.Panel>
        </>
      )}
    </Disclosure>
  );
};

export default Attribute;
