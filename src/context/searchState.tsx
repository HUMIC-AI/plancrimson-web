import React, {
  PropsWithChildren,
  createContext, useContext, useEffect, useMemo, useRef, useState,
} from 'react';
import { useRouter } from 'next/router';
import qs from 'qs';
import {
  CURRENT_ARCHIVE_TERMS, CURRENT_COURSES_TERMS, Semester, getTermId, getUpcomingSemester, semesterToTerm,
} from '@/src/lib';
import { SearchState } from 'react-instantsearch-core';
import { getAnalytics, logEvent } from 'firebase/analytics';
import { throwMissingContext } from '../utils/utils';
import { Auth } from '../features';

interface SearchStateContextType {
  searchState: any;
  setSearchState: React.Dispatch<React.SetStateAction<SearchState>>;
  oneCol: boolean;
  onSearchStateChange: (newState: SearchState) => void;
}

export const createUrl = (state: any) => `?${qs.stringify(state)}`;

const DEBOUNCE_TIME = 400;

/**
 * Used in deeply nested Instantsearch components
 */
const SearchStateContext = createContext<SearchStateContextType>({
  searchState: null,
  setSearchState: throwMissingContext,
  oneCol: false,
  onSearchStateChange: throwMissingContext,
});

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
 * Currently exists a base search provider inside {@link _app.txt}.
 */
export function SearchStateProvider({
  children,
  oneCol = false,
  defaultState,
} : PropsWithChildren<{
  oneCol?: boolean;
  defaultState: SearchState | null;
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
    oneCol,
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
  }), [defaultState, oneCol, router.asPath, searchState, userId]);

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

const useSearchState = () => useContext(SearchStateContext);

export default useSearchState;

export function useDefaultSearchState(semester?: Semester) {
  return useMemo(() => getDefaultSearchStateForSemester(semester ?? getUpcomingSemester()), [semester]);
}
