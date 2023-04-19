import { Disclosure } from '@headlessui/react';
import React, { useState } from 'react';
import { FaChevronDown } from 'react-icons/fa';
import { classNames, compareItems, compareWeekdays } from 'plancrimson-utils';
import { Auth } from '@/src/features';
import RefinementList, { RefinementListDemo } from './RefinementList';

interface AttributeProps {
  attribute: string;
  label: string
  showSubjectColor: boolean;
}

const DisclosureChildren: React.FC<AttributeProps & { open: boolean }> = function ({
  open, attribute, label, showSubjectColor,
}) {
  const user = Auth.useAuthProperty('uid');

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
        <span className="ml-4 inline-flex items-center">
          <button
            type="button"
            onClick={(ev) => {
              ev.stopPropagation();
              setOperator(operator === 'and' ? 'or' : 'and');
            }}
            className="w-8 rounded bg-black text-white hover:font-semibold"
          >
            {operator}
          </button>
          <FaChevronDown className="ml-2 h-5 w-5" />
        </span>
      </Disclosure.Button>
      <Disclosure.Panel unmount={false}>
        <div className="origin-top-right rounded-b bg-gray-light p-2">
          {user ? (
            <RefinementList
              attribute={attribute}
              operator={operator}
              showMore
              showMoreLimit={300}
              transformItems={(items) => items.sort(
                attribute === 'DAY_OF_WEEK' ? compareWeekdays : compareItems,
              )}
              showSubjectColor={showSubjectColor}
            />
          ) : (
            <RefinementListDemo />
          )}
        </div>
      </Disclosure.Panel>
    </>
  );
};

/**
 * Renders an expandable menu to filter a given attribute
 * @param attribute the Meilisearch attribute to filter by
 * @param label the text to show
 */
export default function Attribute({ attribute, label, showSubjectColor }: AttributeProps) {
  return (
    <Disclosure as="div">
      {({ open }) => (
        <DisclosureChildren open={open} attribute={attribute} label={label} showSubjectColor={showSubjectColor} />
      )}
    </Disclosure>
  );
}
