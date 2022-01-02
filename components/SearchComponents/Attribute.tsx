import { Disclosure } from '@headlessui/react';
import React, { useState } from 'react';
import { FaChevronDown } from 'react-icons/fa';
import { DayOfWeek, DAYS_OF_WEEK } from '../../shared/apiTypes';
import { classNames } from '../../shared/util';
import useUser, { alertSignIn } from '../../src/context/user';
import RefinementList, { RefinementListComponent } from './RefinementList';

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
  const { user } = useUser();
  return (
    <Disclosure as="div">
      {({ open }) => (
        <>
          <Disclosure.Button
            className={classNames(
              'bg-white flex justify-between items-center w-full py-2 px-3',
              'text-sm text-left font-medium',
              open ? 'rounded-t' : 'rounded',
            )}
            as="div"
          >
            <h3 className="flex-1">{label}</h3>
            <span className="inline-flex items-center ml-4">
              <button
                type="button"
                onClick={(ev) => {
                  ev.stopPropagation();
                  setOperator(operator === 'and' ? 'or' : 'and');
                }}
                className="hover:font-semibold w-8 bg-gray-700 rounded text-white"
              >
                {operator}
              </button>
              <FaChevronDown className="w-5 h-5 ml-2" />
            </span>
          </Disclosure.Button>
          <Disclosure.Panel unmount={false}>
            <div className="p-2 origin-top-right bg-gray-300 rounded-b">
              {user ? (
                <RefinementList
                  attribute={attribute}
                  operator={operator}
                  showMore
                  showMoreLimit={300}
                  transformItems={(items) => (attribute === 'DAY_OF_WEEK'
                    ? items.sort(compareWeekdays)
                    : items.sort(compareItems))}
                />
              ) : (
                <RefinementListComponent
                  items={[
                    {
                      count: Math.floor(Math.random() * 50),
                      isRefined: true,
                      label: 'Example',
                      objectID: '',
                      value: ['Example'],
                      _highlightResult: {},
                    },
                    {
                      count: Math.floor(Math.random() * 50),
                      isRefined: false,
                      label: 'Sign in to get started',
                      objectID: '',
                      value: [],
                      _highlightResult: {},
                    },
                  ]}
                  refine={alertSignIn}
                />
              )}
            </div>
          </Disclosure.Panel>
        </>
      )}
    </Disclosure>
  );
};

export default Attribute;
