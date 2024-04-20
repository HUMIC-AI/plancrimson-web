import { Disclosure } from '@headlessui/react';
import React, { forwardRef } from 'react';
import { compareItems, compareWeekdays } from '@/src/lib';
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
export default forwardRef(({ attribute, label, showSubjectColor }: AttributeProps, ref: any) => (
  <Disclosure as="div" ref={ref}>
    <DisclosureChildren
      attribute={attribute}
      label={label}
      showSubjectColor={showSubjectColor}
    />
  </Disclosure>
));

function DisclosureChildren({
  attribute, label, showSubjectColor,
}: AttributeProps) {
  // const [operator, setOperator] = useState<'and' | 'or'>('or');
  const operator = 'or';

  return (
    <>
      <div className="flex items-stretch border-b border-gray-primary">
        <Disclosure.Button className="interactive flex-1 cursor-pointer rounded-tl-lg px-3 py-2 text-left text-sm font-medium">
          {label}
        </Disclosure.Button>

        {/* <button
          type="button"
          onClick={() => {
            setOperator(operator === 'and' ? 'or' : 'and');
          }}
          className={classNames(
            'w-10 rounded-tr-lg transition-colors hover:bg-gray-secondary/50',
          )}
        >
          <span className="opacity-50">
            {operator}
          </span>
        </button> */}
      </div>

      <FadeTransition unmount={false}>
        <Disclosure.Panel unmount={false}>
          <div className="origin-top-right rounded-b-lg border-x border-b border-gray-primary p-2 text-left">
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
