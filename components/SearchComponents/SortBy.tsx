import React from 'react';
import { connectSortBy } from 'react-instantsearch-dom';
import { alertSignIn, SORT_INDEXES } from './SearchBox/searchUtils';
import useClientOrDemo from './ClientOrDemo';
import type { IndexName } from '../../src/lib';
import { GridButtons } from './GridButtons';

type Item = {
  value: string;
  label: string;
  isRefined: boolean;
};

type SortByProps = {
  // eslint-disable-next-line react/no-unused-prop-types
  defaultRefinement: IndexName;
  items: Item[];
  refine: (value: string) => any;
};

function SortByComponent({
  items,
  refine = alertSignIn,
}: SortByProps) {
  return (
    <GridButtons
      title="Sort by"
      items={items.map(({ isRefined, label, value }: Item) => ({
        label,
        selected: isRefined,
        onClick: () => refine(value),
      }))}
    />
  );
}


export default function SortBy({ indexName }: { indexName: IndexName }) {
  const Component = useClientOrDemo(
    connectSortBy,
    SortByComponent,
  );
  return (
    <Component
      defaultRefinement={indexName}
      items={SORT_INDEXES(indexName).map((val, i) => ({
        ...val,
        isRefined: i === 0,
      }))}
    />
  );
}
