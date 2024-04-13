import React, { Fragment } from 'react';
import { connectCurrentRefinements } from 'react-instantsearch-dom';
import type { CurrentRefinementsProvided, Refinement } from 'react-instantsearch-core';
import {
  type IndexName,
  TERM_TO_SEASON,
  adjustAttr,
  compareItems,
  compareWeekdays,
} from '@/src/lib';
import { alertSignIn } from './SearchBox/searchUtils';
import useClientOrDemo from './ClientOrDemo';
import SortBy from './SortBy';
import { GridButtons } from './GridButtons';

type Provided = Pick<CurrentRefinementsProvided, 'items' | 'refine'>;

function CurrentRefinementsComponent({
  items: refinements = [],
  refine = alertSignIn,
}: Provided) {
  if (refinements.length === 0) {
    return (
      <span className="relative col-span-2">
        Filter for courses using the menu!
      </span>
    );
  }

  const uniqueRefinements = getUniqueRefinements(refinements);

  const refinementElements = uniqueRefinements.map(([id, items]) => (
    <Fragment key={id}>
      <GridButtons
        title={adjustAttr(id)}
        showRemove
        items={items
          .sort(
            id === 'DAY_OF_WEEK'
              ? compareWeekdays
              : compareItems,
          ).map(({ label, value }) => ({
            label: (label in TERM_TO_SEASON) ? `${TERM_TO_SEASON[label]?.season} ${TERM_TO_SEASON[label]?.year}` : label,
            selected: true,
            onClick: () => refine(value),
          }))}
      />
    </Fragment>
  ));

  return <>{refinementElements}</>;
}

function getUniqueRefinements(refinements: Refinement[]) {
  return refinements.reduce(
    (acc, { id, items }) => (
      acc.find(([r]) => r === id) ? acc : [...acc, [id, items!] as const]),
    [] as Array<readonly [string, NonNullable<Refinement['items']>]>,
  );
}

export default function CurrentRefinements() {
  const Component = useClientOrDemo<Provided, {}>(
    connectCurrentRefinements,
    CurrentRefinementsComponent,
  );
  return <Component />;
}

export function SortingAndRefinementsGrid({ indexName }: { indexName: IndexName; }) {
  return (
    <div className="grid grid-cols-[auto_1fr] items-center gap-2">
      <SortBy indexName={indexName} />
      <CurrentRefinements />
    </div>
  );
}
