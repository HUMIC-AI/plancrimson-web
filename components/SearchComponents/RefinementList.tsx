import React, { useState, useMemo } from 'react';
import type { RefinementListProvided } from 'react-instantsearch-core';
import { connectRefinementList } from 'react-instantsearch-dom';
import { getSubjectColor, subjects, TERM_TO_SEASON } from 'plancrimson-utils';
import { classNames } from '@/src/utils';
import { alertSignIn } from './searchUtils';

type Props = Pick<RefinementListProvided, 'items' | 'refine'> & { showSubjectColor: boolean };

/**
 * A pure component which renders the list of refinements.
 * E.g. for the "SUBJECT" attribute, this will render a list containing
 * "AFRAMER (88), AFRIKAAN (2), etc" with a checkbox beside each one.
 */
export function RefinementListComponent({ items, refine, showSubjectColor }: Props) {
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
        className="block w-full rounded-md border-gray-light py-1 pl-2 shadow-sm sm:text-sm"
      />
      <button
        type="button"
        onClick={() => refine([])}
        className="mb-2 ml-1 text-xs leading-none text-gray-dark underline transition-colors hover:opacity-50"
      >
        Clear all
      </button>
      <ul className="max-h-64 overflow-auto">
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
                  style={{ color: (showSubjectColor && label in subjects) ? getSubjectColor(label) : 'inherit' }}
                >
                  {label in TERM_TO_SEASON ? `${TERM_TO_SEASON[label].season} ${TERM_TO_SEASON[label].year}` : label}
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
}

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
      showSubjectColor={false}
    />
  );
}

export default connectRefinementList(RefinementListComponent);
