import React, { Fragment } from 'react';
import { FaTimes } from 'react-icons/fa';
import type { CurrentRefinementsProvided } from 'react-instantsearch-core';
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

export const CurrentRefinementsComponent: React.FC<Props> = function ({
  items: refinements,
  refine,
}) {
  return (
    // eslint-disable-next-line react/jsx-no-useless-fragment
    <>
      {refinements.length === 0 ? (
        <span className="relative col-span-2">
          Filter for courses using the menu!
        </span>
      ) : (
        refinements.map((item) => (
          <Fragment key={item.label}>
            {item.items ? (
              <>
                <h4 className="font-medium w-min md:min-w-max">
                  <button
                    type="button"
                    className="hover:line-through"
                    onClick={() => refine(item.value)}
                  >
                    {adjustAttr(item.attribute)}
                    :
                  </button>
                </h4>
                <ul className="flex flex-wrap items-center gap-2 h-min">
                  {item.items
                    .sort(
                      item.attribute === 'DAY_OF_WEEK'
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
              </>
            ) : (
              <button type="button" onClick={() => refine(item.value)}>
                {termToSeasonMap[item.label]?.season || item.label}
              </button>
            )}
          </Fragment>
        ))
      )}
    </>
  );
};

export function CurrentRefinementsDemo() {
  return (
    <CurrentRefinementsComponent
      items={[]}
      refine={alertSignIn}
    />
  );
}

export default connectCurrentRefinements(CurrentRefinementsComponent);
