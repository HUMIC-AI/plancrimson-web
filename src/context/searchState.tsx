import React, {
  PropsWithChildren,
  createContext, useContext, useEffect, useMemo, useRef, useState,
} from 'react';
import { useRouter } from 'next/router';
import qs from 'qs';
import { Semester, getTermId } from '@/src/lib';
import { SearchState } from 'react-instantsearch-core';
import { throwMissingContext } from '../utils/utils';

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

export function getDefaultSearchStateForSemester(semester: Semester) {
  return {
    refinementList: {
      STRM: [getTermId(semester)],
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
  ignoreUrl = false,
} : PropsWithChildren<{
  oneCol?: boolean;
  defaultState?: SearchState;
  ignoreUrl?: boolean;
}>) {
  const [searchState, setSearchState] = useState(defaultState || {});

  const context = useMemo(() => ({
    searchState,
    setSearchState,
    oneCol,
    onSearchStateChange(newState: SearchState) {
      setSearchState((oldState) => ({ ...oldState, ...newState }));
    },
  }), [oneCol, searchState]);

  return (
    <SearchStateContext.Provider value={context}>
      {children}
    </SearchStateContext.Provider>
  );
}

/**
 * @deprecated
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
