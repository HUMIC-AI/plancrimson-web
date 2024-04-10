import React, { Fragment } from 'react';
import { FaTimes } from 'react-icons/fa';
import { connectCurrentRefinements } from 'react-instantsearch-dom';
import type { CurrentRefinementsProvided, Refinement } from 'react-instantsearch-core';
import {
  TERM_TO_SEASON,
  adjustAttr,
  compareItems,
  compareWeekdays,
} from '@/src/lib';
import { classNames } from '@/src/utils/styles';
import { alertSignIn } from './SearchBox/searchUtils';
import useClientOrDemo from './ClientOrDemo';

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
      <h4 className="w-min md:whitespace-nowrap">
        {adjustAttr(id)}
        :
      </h4>

      <ul className="flex h-min flex-wrap items-center gap-2">
        {items
          .sort(
            id === 'DAY_OF_WEEK'
              ? compareWeekdays
              : compareItems,
          )
          .map(({ label, value }) => {
            const name = (label in TERM_TO_SEASON) ? `${TERM_TO_SEASON[label]?.season} ${TERM_TO_SEASON[label]?.year}` : label;
            return (
              <button
                key={label}
                type="button"
                name={name}
                className={classNames(
                  'py-1 px-2 hover-blue rounded flex items-center text-sm',
                )}
                onClick={() => refine(value)}
              >
                {name}
                <FaTimes className="ml-2" />
              </button>
            );
          })}
      </ul>
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
