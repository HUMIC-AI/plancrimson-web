import { Disclosure } from '@headlessui/react';
import React, { useState } from 'react';
import { FaChevronDown } from 'react-icons/fa';
import { classNames } from '../../shared/util';
import useUser, { alertSignIn } from '../../src/context/user';
import RefinementList, { RefinementListComponent } from './RefinementList';

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
              'text-sm text-left font-medium cursor-pointer hover:bg-opacity-50 transition-colors',
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
                className="hover:font-semibold w-8 bg-gray-800 rounded text-white"
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
                />
              ) : (
                <RefinementListComponent
                  items={[
                    {
                      count: 42,
                      isRefined: true,
                      label: 'Example',
                      objectID: '',
                      value: ['Example'],
                      _highlightResult: {},
                    },
                    {
                      count: 69,
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
