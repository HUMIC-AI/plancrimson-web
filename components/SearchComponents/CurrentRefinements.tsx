import React from 'react';
import { FaTimes } from 'react-icons/fa';
import type { CurrentRefinementsProvided } from 'react-instantsearch-core';
import { connectCurrentRefinements } from 'react-instantsearch-dom';
import {
  adjustAttr, adjustLabel, classNames, compareWeekdays,
} from '../../shared/util';

type Props = Pick<CurrentRefinementsProvided, 'items' | 'refine'>;

export const CurrentRefinementsComponent: React.FC<Props> = function ({
  items,
  refine,
}) {
  return (
    <ul className="flex items-center flex-wrap gap-4">
      {items.length === 0 ? (
        <li>Filter for courses using the menu!</li>
      ) : (
        items.map((item) => (
          <li key={item.label}>
            {item.items ? (
              <div className="flex items-center">
                <span className="font-medium">
                  {adjustAttr(item.attribute)}
                  :
                </span>
                <ul className="contents">
                  {item.items
                    .sort(item.attribute === 'DAY_OF_WEEK' ? ((a, b) => compareWeekdays(a.label, b.label)) : ((a, b) => (a.label < b.label ? -1 : a.label > b.label ? 1 : 0)))
                    .map(({ label, value }) => (
                      <button
                        key={label}
                        type="button"
                        name={adjustLabel(label)}
                        className={classNames(
                          'ml-2 py-1 px-2 hover-blue rounded flex items-center',
                        )}
                        onClick={() => refine(value)}
                      >
                        {adjustLabel(label)}
                        <FaTimes className="ml-2" />
                      </button>
                    ))}
                </ul>
              </div>
            ) : (
              <button type="button" onClick={() => refine(item.value)}>
                {adjustLabel(item.label)}
              </button>
            )}
          </li>
        ))
      )}
    </ul>
  );
};

export default connectCurrentRefinements(CurrentRefinementsComponent);
