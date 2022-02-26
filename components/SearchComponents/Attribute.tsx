import { Disclosure } from '@headlessui/react';
import React, { useState } from 'react';
import { FaChevronDown } from 'react-icons/fa';
import { classNames, compareItems, compareWeekdays } from '../../shared/util';
import { useAppSelector } from '../../src/app/hooks';
import { selectUid } from '../../src/features/userData';
import RefinementList, { RefinementListDemo } from './RefinementList';

interface AttributeProps {
  attribute: string;
  label: string
}

const DisclosureChildren: React.FC<AttributeProps & { open: boolean }> = function ({ open, attribute, label }) {
  const user = useAppSelector(selectUid);

  const [operator, setOperator] = useState<'and' | 'or'>('or');

  return (
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
              transformItems={(items) => items.sort(
                attribute === 'DAY_OF_WEEK' ? compareWeekdays : compareItems,
              )}
            />
          ) : (
            <RefinementListDemo />
          )}
        </div>
      </Disclosure.Panel>
    </>
  );
};

const Attribute: React.FC<AttributeProps> = function ({ attribute, label }) {
  return (
    <Disclosure as="div">
      {({ open }) => (
        <DisclosureChildren open={open} attribute={attribute} label={label} />
      )}
    </Disclosure>
  );
};

export default Attribute;
