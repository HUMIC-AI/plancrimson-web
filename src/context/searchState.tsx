import React, {
  PropsWithChildren,
  createContext, useEffect, useMemo, useRef, useState,
} from 'react';
import { useRouter } from 'next/router';
import qs from 'qs';
import {
  CURRENT_ARCHIVE_TERMS, CURRENT_COURSES_TERMS, Semester, getTermId, semesterToTerm, upcomingSemester,
} from '@/src/lib';
import { SearchState } from 'react-instantsearch-core';
import { getAnalytics, logEvent } from 'firebase/analytics';
import { Auth } from '../features';
import { useAssertContext } from '../utils/utils';

interface SearchStateContextType {
  searchState: SearchState | null;
  setSearchState: React.Dispatch<React.SetStateAction<SearchState>>;
  onSearchStateChange: (newState: SearchState) => void;
}

export const createUrl = (state: any) => `?${qs.stringify(state)}`;

const DEBOUNCE_TIME = 400;

/**
 * Used in deeply nested Instantsearch components
 */
const SearchStateContext = createContext<SearchStateContextType | null>(null);

export function getDefaultSearchStateForSemester(semester: Semester): SearchState {
  const termId = getTermId(semester);
  if (!termId || ![...CURRENT_ARCHIVE_TERMS, ...CURRENT_COURSES_TERMS].includes(semesterToTerm(semester))) {
    return {};
  }
  return {
    refinementList: {
      STRM: [termId],
    },
  };
}

/**
 * Provides the search state to all Instantsearch components.
 * Also syncs the URL with the search state.
 * Can pass a default state to use if the URL is empty.
 * Set defaultState to null to prevent all searching.
 * Currently exists a base search provider inside {@link _app.txt}.
 */
export function SearchStateProvider({
  children,
  defaultState,
} : PropsWithChildren<{
  defaultState: SearchState | null;
  // eslint-disable-next-line react/no-unused-prop-types
  ignoreUrl?: boolean;
}>) {
  // don't allow search state unless user is signed in
  const userId = Auth.useAuthProperty('uid');
  const [searchState, setSearchState] = useState<SearchState | null>(defaultState);
  const lastLogTime = useRef(0);
  const router = useRouter();

  const context = useMemo(() => ({
    searchState: userId ? searchState : null,
    setSearchState,
    onSearchStateChange(newState: SearchState) {
      if (defaultState === null) return;

      // merge the new state with the old state
      const now = Date.now();
      if (now - lastLogTime.current > 200) {
        lastLogTime.current = now;
        logEvent(getAnalytics(), 'search', { ...newState, path: router.asPath });
        console.debug('search', newState);
      }

      setSearchState((oldState) => ({ ...oldState, ...newState }));
    },
  }), [defaultState, router.asPath, searchState, userId]);

  return (
    <SearchStateContext.Provider value={context}>
      {children}
    </SearchStateContext.Provider>
  );
}

/**
 * @deprecated
 * Used to sync up with the URL. Buggy.
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function OldSearchStateProvider({
  children,
  oneCol = false,
  defaultState,
  ignoreUrl = false,
} : PropsWithChildren<{
  oneCol?: boolean;
  defaultState?: any;
  ignoreUrl?: boolean;
}>) {
  const router = useRouter();

  // get the query params from the URL. whenever the url changes, update the search state
  const urlQueryParams = useMemo(
    // qs.stringify(undefined) returns an empty string
    () => (!ignoreUrl && router.asPath.split('?')[1]) || qs.stringify(defaultState),
    [defaultState, ignoreUrl, router.asPath],
  );

  // qs.parse('') returns an empty object (not null)
  const [searchState, setSearchState] = useState(qs.parse(urlQueryParams));
  const debouncedSetStateRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    setSearchState(qs.parse(urlQueryParams));
  }, [urlQueryParams]);

  const context = useMemo(() => {
    function onSearchStateChange(newState: SearchState) {
      clearTimeout(debouncedSetStateRef.current);

      const mergedState = {
        ...searchState,
        ...newState,
      };

      debouncedSetStateRef.current = setTimeout(() => {
        router.replace({
          query: qs.stringify({ ...router.query, ...mergedState }),
        }, undefined, { scroll: false, shallow: true });
      }, DEBOUNCE_TIME);

      setSearchState(mergedState);
    }

    return {
      searchState, setSearchState, oneCol, onSearchStateChange,
    };
  }, [oneCol, router, searchState]);

  return (
    <SearchStateContext.Provider value={context}>
      {children}
    </SearchStateContext.Provider>
  );
}

export function useSearchState() {
  return useAssertContext(SearchStateContext);
}

export function useDefaultSearchState(semester?: Semester | null) {
  return useMemo(() => getDefaultSearchStateForSemester(semester ?? upcomingSemester), [semester]);
}
