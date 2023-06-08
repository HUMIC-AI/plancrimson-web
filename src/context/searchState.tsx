import React, {
  createContext, useContext, useEffect, useMemo, useRef, useState,
} from 'react';
import { useRouter } from 'next/router';
import qs from 'qs';
import { throwMissingContext } from '../utils/utils';

interface SearchStateContextType {
  searchState: any;
  setSearchState: React.Dispatch<React.SetStateAction<any>>;
  oneCol: boolean;
  onSearchStateChange: (newState: any) => void;
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

const DEFAULT_SEARCH_STATE = {
  // the current term
  refinementList: { STRM: ['2238'] },
};

export function SearchStateProvider({ children, oneCol = false } : React.PropsWithChildren<{ oneCol?: boolean }>) {
  const router = useRouter();
  const search = useMemo(
    () => router.asPath.split('?')[1] ?? qs.stringify(DEFAULT_SEARCH_STATE),
    [router.asPath],
  );

  const [searchState, setSearchState] = useState(qs.parse(search));
  const debouncedSetStateRef = useRef<any>(null);

  useEffect(() => {
    setSearchState(qs.parse(search));
  }, [search]);

  const context = useMemo(() => {
    function onSearchStateChange(newState: any) {
      clearTimeout(debouncedSetStateRef.current);

      const mergedState = { ...searchState, ...newState };

      debouncedSetStateRef.current = setTimeout(() => {
        router.replace({
          query: qs.stringify(mergedState),
        });
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
