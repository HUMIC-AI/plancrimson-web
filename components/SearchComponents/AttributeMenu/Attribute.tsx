import { Disclosure } from '@headlessui/react';
import React, { useState } from 'react';
import { compareItems, compareWeekdays } from '@/src/lib';
import { classNames } from '@/src/utils/styles';
import FadeTransition from '@/components/Utils/FadeTransition';
import RefinementList from '../RefinementList';

interface AttributeProps {
  attribute: string;
  label: string
  showSubjectColor: boolean;
}

/**
 * Renders an expandable menu to filter a given attribute
 * @param attribute the Meilisearch attribute to filter by
 * @param label the text to show
 */
export default function Attribute({ attribute, label, showSubjectColor }: AttributeProps) {
  return (
    <Disclosure as="div">
      <DisclosureChildren
        attribute={attribute}
        label={label}
        showSubjectColor={showSubjectColor}
      />
    </Disclosure>
  );
}

function DisclosureChildren({
  attribute, label, showSubjectColor,
}: AttributeProps) {
  const [operator, setOperator] = useState<'and' | 'or'>('or');

  return (
    <>
      <div className="flex items-stretch border-b border-gray-light">
        <Disclosure.Button
          className={classNames(
            'flex-1 py-2 px-3 rounded-tl-lg',
            'text-sm text-left font-medium cursor-pointer',
            'hover:bg-gray-dark/50 transition-colors',
          )}
          as="h3"
        >
          {label}
        </Disclosure.Button>

        <button
          type="button"
          onClick={() => {
            setOperator(operator === 'and' ? 'or' : 'and');
          }}
          className={classNames(
            'w-10 rounded-tr-lg opacity-50 transition-colors hover:bg-gray-dark/50',
          )}
        >
          {operator}
        </button>
      </div>

      <FadeTransition>
        <Disclosure.Panel unmount={false}>
          <div className="origin-top-right rounded-b-lg bg-gray-light p-2 text-black">
            <RefinementList
              attribute={attribute}
              operator={operator}
              showMore
              showMoreLimit={300}
              transformItems={(items: any[]) => items.sort(
                attribute === 'DAY_OF_WEEK' ? compareWeekdays : compareItems,
              )}
              showSubjectColor={showSubjectColor}
            />
          </div>
        </Disclosure.Panel>
      </FadeTransition>
    </>
  );
}
