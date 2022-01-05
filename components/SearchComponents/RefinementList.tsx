import React, { useState, useEffect } from 'react';
import type {
  RefinementListProvided,
} from 'react-instantsearch-core';
import { connectRefinementList } from 'react-instantsearch-dom';
import { termNumberToSeason, classNames } from '../../shared/util';
import useCardStyle from '../../src/context/cardStyle';

type Props = Pick<RefinementListProvided, 'items' | 'refine'>;

export const RefinementListComponent: React.FC<Props> = function ({
  items,
  refine,
}) {
  return (
    <ul className="overflow-y-auto max-h-64">
      {items.map(({
        label, isRefined, count, value,
      }) => (
        <li key={label}>
          <label htmlFor={label}>
            <input
              type="checkbox"
              name={label}
              id={label}
              checked={isRefined}
              onChange={() => refine(value)}
            />
            <span className={classNames('ml-2', isRefined && 'font-semibold')}>
              {termNumberToSeason(label)}
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

const InnerWrapper: React.FC<Props> = function ({
  items,
  refine,
}) {
  const [allItems, setAllItems] = useState<typeof items>([]);
  const { isExpanded } = useCardStyle();

  // console.log('outsidefoo', isExpanded);

  useEffect(() => {
    // items only contains a list of the refined items
    setAllItems((prev) => {
      if (items.length > prev.length) return items;

      const allChecked = items.filter((i) => i.isRefined).map((i) => i.label);

      const hasLabel: Record<string, typeof items[number]> = {};
      items.forEach((item) => {
        hasLabel[item.label] = item;
      });

      return prev.map(
        (oldItem) => hasLabel[oldItem.label] || {
          ...oldItem,
          isRefined: false,
          value: [...allChecked, oldItem.label],
        },
      );
    });
  }, [items]);

  if (isExpanded) {
    return <RefinementListComponent items={allItems} refine={refine} />;
  }

  return null;
};

export default connectRefinementList(InnerWrapper);
