import React, { Fragment } from 'react';
import { FaTimes } from 'react-icons/fa';
import type { CurrentRefinementsProvided } from 'react-instantsearch-core';
import { connectCurrentRefinements } from 'react-instantsearch-dom';
import {
  adjustAttr,
  adjustLabel,
  classNames,
  compareItems,
  compareWeekdays,
} from '../../shared/util';

type Props = Pick<CurrentRefinementsProvided, 'items' | 'refine'>;

export const CurrentRefinementsComponent: React.FC<Props> = function ({
  items: refinements,
  refine,
}) {
  return (
    // eslint-disable-next-line react/jsx-no-useless-fragment
    <>
      {refinements.length === 0 ? (
        <span className="relative">
          <span className="absolute min-w-max">
            Filter for courses using the menu!
          </span>
          <span>&nbsp;</span>
        </span>
      ) : (
        refinements.map((item) => (
          <Fragment key={item.label}>
            {item.items ? (
              <>
                <span className="font-medium min-w-max">
                  {adjustAttr(item.attribute)}
                  :
                </span>
                <ul className="flex flex-wrap items-center gap-2">
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
                        name={adjustLabel(label)}
                        className={classNames(
                          'py-1 px-2 hover-blue rounded flex items-center text-sm',
                        )}
                        onClick={() => refine(value)}
                      >
                        {adjustLabel(label)}
                        <FaTimes className="ml-2" />
                      </button>
                    ))}
                </ul>
              </>
            ) : (
              <button type="button" onClick={() => refine(item.value)}>
                {adjustLabel(item.label)}
              </button>
            )}
          </Fragment>
        ))
      )}
    </>
  );
};

export default connectCurrentRefinements(CurrentRefinementsComponent);
