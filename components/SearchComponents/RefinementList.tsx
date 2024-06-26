import React, { useState, useMemo } from 'react';
import type { RefinementListExposed, RefinementListProvided } from 'react-instantsearch-core';
import { connectRefinementList } from 'react-instantsearch-dom';
import {
  Subject, subjects, TERM_TO_SEASON,
} from '@/src/lib';
import { classNames, getSubjectColor } from '@/src/utils/styles';
import { getAnalytics, logEvent } from 'firebase/analytics';
import { alertSignIn } from './SearchBox/searchUtils';
import useClientOrDemo from './ClientOrDemo';

type Provided = Pick<RefinementListProvided, 'items' | 'refine'>;

// eslint-disable-next-line react/no-unused-prop-types
type Exposed = RefinementListExposed & { showSubjectColor: boolean };

type Props = Provided & Exposed;

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
function RefinementListComponent({
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
        className="primary block w-full rounded-md border-gray-primary py-1 pl-2 shadow-sm sm:text-sm"
      />

      <button
        type="button"
        onClick={() => refine([])}
        className="mb-2 ml-1 text-xs leading-none underline transition-colors hover:opacity-50"
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
                  onChange={() => {
                    const analytics = getAnalytics();
                    logEvent(analytics, 'search_filter', {
                      filter: label,
                      // set opposite since this is on a flip
                      value: isRefined ? 'off' : 'on',
                    });
                    refine(value);
                  }}
                />

                <span
                  className={classNames(
                    'ml-2 transition-opacity',
                    isRefined ? 'font-semibold' : 'font-light',
                    count === 0 && 'opacity-50',
                  )}
                  style={{
                    color: (showSubjectColor && label in subjects)
                      ? getSubjectColor(label as Subject)
                      : 'inherit',
                  }}
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

/**
 * There'll be one of these for each of the (MeiliSearch) attributes that you can filter by.
 */
export default function RefinementList(props: Exposed) {
  const Component = useClientOrDemo<Provided, Exposed>(
    connectRefinementList as any,
    RefinementListComponent,
  );
  return <Component {...props} />;
}
