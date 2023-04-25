import React, { useState, useMemo } from 'react';
import type { RefinementListExposed, RefinementListProvided } from 'react-instantsearch-core';
import { connectRefinementList } from 'react-instantsearch-dom';
import {
  getSubjectColor, Subject, subjects, TERM_TO_SEASON,
} from '@/src/lib';
import { classNames } from '@/src/utils/styles';
import { alertSignIn } from './SearchBox/searchUtils';
import ClientOrDemo from './ClientOrDemo';

type Props = Pick<RefinementListProvided, 'items' | 'refine'> & { showSubjectColor: boolean };

const defaultItems = [
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
];

/**
 * A pure component which renders the list of refinements.
 * E.g. for the "SUBJECT" attribute, this will render a list containing
 * "AFRAMER (88), AFRIKAAN (2), etc" with a checkbox beside each one.
 */
export function RefinementListComponent({
  items = defaultItems,
  refine = alertSignIn,
  showSubjectColor = false,
}: Props) {
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
                  style={{ color: (showSubjectColor && label in subjects) ? getSubjectColor(label as Subject) : 'inherit' }}
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

// eslint-disable-next-line react/no-unused-prop-types
export default function (props: RefinementListExposed & { showSubjectColor: boolean }) {
  return (
    <ClientOrDemo
      connector={connectRefinementList}
      component={RefinementListComponent}
      extraProps={props}
    />
  );
}
