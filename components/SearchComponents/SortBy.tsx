import { classNames } from '@/src/utils';
import React from 'react';
import { connectSortBy } from 'react-instantsearch-dom';
import { alertSignIn, SORT_INDEXES } from './SearchBox/searchUtils';

type Item = {
  value: string;
  label: string;
  isRefined: boolean;
};

type SortByProps = {
  items: Item[];
  refine: (value: string) => any;
};

export const SortByComponent: React.FC<SortByProps> = function ({
  items,
  refine,
}) {
  return (
    <>
      <h3 className="font-medium md:whitespace-nowrap">
        Sort by:
      </h3>

      <ul className="flex h-min flex-wrap items-center gap-2">
        {items.map((item: Item) => (
          <li key={item.value} className="contents">
            <button
              type="button"
              className={classNames(
                item.isRefined && 'font-bold bg-primary-dark',
                'shadow rounded py-1 px-2 hover-blue text-sm min-w-min',
              )}
              onClick={(event) => {
                event.preventDefault();
                refine(item.value);
              }}
            >
              {item.label}
            </button>
          </li>
        ))}
      </ul>
    </>
  );
};

export function SortByDemo() {
  return (
    <SortByComponent
      items={SORT_INDEXES.map((val, i) => ({
        ...val,
        isRefined: i === 0,
      }))}
      refine={alertSignIn}
    />
  );
}

const Wrapper = connectSortBy(SortByComponent);

export default function SortBy() {
  return <Wrapper defaultRefinement="courses" items={SORT_INDEXES} />;
}
