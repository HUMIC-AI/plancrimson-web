import React, { Fragment } from 'react';
import { FaTimes } from 'react-icons/fa';
import type { CurrentRefinementsProvided, Refinement } from 'react-instantsearch-core';
import { connectCurrentRefinements } from 'react-instantsearch-dom';
import {
  adjustAttr,
  classNames,
  compareItems,
  compareWeekdays,
  termToSeasonMap,
} from '../../shared/util';
import { alertSignIn } from './searchUtils';

type Props = Pick<CurrentRefinementsProvided, 'items' | 'refine'>;

export const CurrentRefinementsComponent = function ({
  items: refinements,
  refine,
}: Props) {
  if (refinements.length === 0) {
    return (
      <span className="relative col-span-2">
        Filter for courses using the menu!
      </span>
    );
  }

  const refinementElements = getUniqueRefinements(refinements).map(([id, items]) => (
    <Fragment key={id}>
      <h4 className="w-min font-medium md:min-w-max">
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
          .map(({ label, value }) => (
            <button
              key={label}
              type="button"
              name={termToSeasonMap[label]?.season || label}
              className={classNames(
                'py-1 px-2 hover-blue rounded flex items-center text-sm',
              )}
              onClick={() => refine(value)}
            >
              {termToSeasonMap[label]?.season || label}
              <FaTimes className="ml-2" />
            </button>
          ))}
      </ul>
    </Fragment>
  ));

  // eslint-disable-next-line react/jsx-no-useless-fragment
  return <>{refinementElements}</>;
};

function getUniqueRefinements(refinements: Refinement[]) {
  return refinements.reduce(
    (acc, { id, items }) => (
      acc.find(([r]) => r === id) ? acc : [...acc, [id, items!] as const]),
    [] as Array<readonly [string, NonNullable<Refinement['items']>]>,
  );
}

export function CurrentRefinementsDemo() {
  return (
    <CurrentRefinementsComponent
      items={[]}
      refine={alertSignIn}
    />
  );
}

export default connectCurrentRefinements(CurrentRefinementsComponent);
