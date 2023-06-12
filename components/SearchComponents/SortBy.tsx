import { classNames } from '@/src/utils/styles';
import React from 'react';
import { connectSortBy } from 'react-instantsearch-dom';
import { alertSignIn, SORT_INDEXES } from './SearchBox/searchUtils';
import ClientOrDemo from './ClientOrDemo';

type Item = {
  value: string;
  label: string;
  isRefined: boolean;
};

type SortByProps = {
  items: Item[];
  refine: (value: string) => any;
};

function SortByComponent({
  items = SORT_INDEXES.map((val, i) => ({
    ...val,
    isRefined: i === 0,
  })),
  refine = alertSignIn,
}: SortByProps) {
  return (
    <>
      <h4 className="md:whitespace-nowrap">
        Sort by:
      </h4>

      <ul className="flex h-min flex-wrap items-center gap-2">
        {items.map((item: Item) => (
          <li key={item.value} className="contents">
            <button
              type="button"
              className={classNames(
                item.isRefined && 'font-bold bg-blue-dark',
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
}


export default function () {
  return (
    <ClientOrDemo
      connector={connectSortBy}
      component={SortByComponent}
      extraProps={{
        defaultRefinement: 'courses',
        items: SORT_INDEXES,
      }}
    />
  );
}
