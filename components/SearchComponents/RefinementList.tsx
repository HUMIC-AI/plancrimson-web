import React, { useState, useEffect } from 'react';
import type { RefinementListProvided } from 'react-instantsearch-core';
import { connectRefinementList } from 'react-instantsearch-dom';
import { adjustLabel, classNames } from '../../shared/util';

export const RefinementListComponent: React.FC<Pick<RefinementListProvided, 'items' | 'refine'>> = function ({ items, refine }) {
  const [allItems, setAllItems] = useState(items);
  useEffect(() => {
    setAllItems((prev) => (items.length > prev.length
      ? items
      : (prev.map(
        (oldItem) => items.find((newItem) => newItem.label === oldItem.label)
              || { ...oldItem, isRefined: false },
      ))));
  }, [items]);

  return (
    <ul className="overflow-y-auto max-h-64">
      {allItems.map(({
        label,
        isRefined,
        count,
        value,
      }) => (
        <li key={label}>
          <label htmlFor={label}>
            <input
              type="checkbox"
              name={label}
              id={label}
              checked={isRefined}
              onChange={() => value && refine(value)}
            />
            <span className={classNames('ml-2', isRefined && 'font-semibold')}>
              {adjustLabel(label)}
              {' '}
              (
              {count}
              )
            </span>
          </label>
        </li>
      ))}
    </ul>
  );
};

export default connectRefinementList(RefinementListComponent);
