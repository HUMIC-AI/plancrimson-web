import React, { useState, useEffect, useMemo } from 'react';
import type { RefinementListProvided } from 'react-instantsearch-core';
import { connectRefinementList } from 'react-instantsearch-dom';
import { classNames, termToSeasonMap } from '../../shared/util';
import { alertSignIn } from './searchUtils';

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
                    {label in termToSeasonMap ? `${termToSeasonMap[label].season} ${termToSeasonMap[label].year}` : label}
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

  return <RefinementListComponent items={allItems} refine={refine} />;
};

export function RefinementListDemo() {
  return (
    <RefinementListComponent
      items={[
        {
          count: 42,
          isRefined: true,
          label: 'Example',
          objectID: '',
          value: ['Example'],
          _highlightResult: {},
        },
        {
          count: 69,
          isRefined: false,
          label: 'Sign in to get started',
          objectID: '',
          value: [],
          _highlightResult: {},
        },
      ]}
      refine={alertSignIn}
    />
  );
}

export default connectRefinementList(InnerWrapper);
