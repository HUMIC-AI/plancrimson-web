import React, { useState, useEffect, useMemo } from 'react';
import type { RefinementListProvided } from 'react-instantsearch-core';
import { connectRefinementList } from 'react-instantsearch-dom';
import { adjustLabel, classNames, compareWeekdays } from '../../shared/util';

export const RefinementListComponent: React.FC<Pick<RefinementListProvided, 'items' | 'refine'>> = function ({
  items, refine,
}) {
  const [allItems, setAllItems] = useState<Record<string, { isRefined: boolean; count: number }>>({});

  useEffect(() => {
    setAllItems((prev) => {
      const newState = { ...prev };
      items.forEach((item) => {
        if (!newState[item.label]) newState[item.label] = item;
        else newState[item.label].count = item.count;
      });
      return newState;
    });
  }, [items]);

  const [allLabels, checkedLabels] = useMemo(
    () => {
      const labels = 'Monday' in allItems
        ? Object.keys(allItems).sort(compareWeekdays)
        : Object.keys(allItems).sort();
      const checked = labels.filter((label) => allItems[label].isRefined);
      return [labels, checked];
    },
    [allItems],
  );

  return (
    <ul className="overflow-y-auto max-h-64">
      {allLabels.map((label) => (
        <li key={label}>
          <label htmlFor={label}>
            <input
              type="checkbox"
              name={label}
              id={label}
              checked={allItems[label].isRefined}
              onChange={({ currentTarget: { checked } }) => {
                const newRefinement = checked
                  ? [...checkedLabels, label]
                  : checkedLabels.filter((l) => l !== label);
                refine(newRefinement);
                setAllItems({
                  ...allItems,
                  [label]: {
                    count: allItems[label].count,
                    isRefined: checked,
                  },
                });
              }}
            />
            <span className={classNames('ml-2', allItems[label].isRefined && 'font-semibold')}>
              {adjustLabel(label)}
              {' '}
              (
              {allItems[label].count}
              )
            </span>
          </label>
        </li>
      ))}
    </ul>
  );
};

export default connectRefinementList(RefinementListComponent);
