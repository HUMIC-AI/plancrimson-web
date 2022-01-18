import React, { useState, useEffect, useMemo } from 'react';
import type { RefinementListProvided } from 'react-instantsearch-core';
import { connectRefinementList } from 'react-instantsearch-dom';
import { termNumberToSeason, classNames } from '../../shared/util';
import useCardStyle from '../../src/context/cardStyle';

type Props = Pick<RefinementListProvided, 'items' | 'refine'>;

/**
 * A pure component which renders the list of refinements.
 * E.g. for the "SUBJECT" attribute, this will render a list containing
 * "AFRAMER (88), AFRIKAAN (2), etc" with a checkbox beside each one.
 */
export const RefinementListComponent = React.memo(
  ({ items, refine }: Props) => {
    const [miniSearch, setMiniSearch] = useState('');

    const re = useMemo(() => new RegExp(miniSearch, 'i'), [miniSearch]);

    return (
      <>
        <input
          type="text"
          name="filter"
          value={miniSearch}
          onChange={({ currentTarget }) => setMiniSearch(currentTarget.value)}
          placeholder="Filter"
          className="block w-full pl-2 py-1 sm:text-sm border-gray-300 rounded-md shadow-sm"
        />
        <button
          type="button"
          onClick={() => refine([])}
          className="text-gray-600 underline ml-1 hover:opacity-50 transition-colors text-xs leading-none mb-2"
        >
          Clear all
        </button>
        <ul className="overflow-auto max-h-64">
          {items
            .filter(({ label }) => re.test(label))
            .map(({
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
                  <span
                    className={classNames('ml-2', isRefined && 'font-semibold')}
                  >
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
      </>
    );
  },
);

/**
 * Differs from default InstantSearch behaviour by persisting all items in the returned facet,
 * even those which aren't in the current search.
 * @param items eg for the "SUBJECT" attribute, its elements will correspond to "AFRAMER", "AFRIKAAN", etc
 * @returns a {@link RefinementListComponent} that renders the items
 */
const InnerWrapper: React.FC<Props> = function ({ items, refine }) {
  const [allItems, setAllItems] = useState<typeof items>([]);
  const { isExpanded } = useCardStyle();

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
