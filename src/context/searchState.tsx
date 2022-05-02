import React, {
  createContext, useContext, useMemo, useState,
} from 'react';
import { throwMissingContext } from '../../shared/util';

interface SearchStateContextType {
  searchState: any;
  setSearchState: React.Dispatch<React.SetStateAction<any>>;
  oneCol: boolean;
}

/**
 * Used in deeply nested Instantsearch components
 */
const SearchStateContext = createContext<SearchStateContextType>({
  searchState: null,
  setSearchState: throwMissingContext,
  oneCol: false,
});

export function SearchStateProvider({ children, oneCol = false } : React.PropsWithChildren<{ oneCol?: boolean }>) {
  const [searchState, setSearchState] = useState({});

  const context = useMemo(() => ({
    searchState, setSearchState, oneCol,
  }), [oneCol, searchState]);

  return (
    <SearchStateContext.Provider value={context}>
      {children}
    </SearchStateContext.Provider>
  );
}

const useSearchState = () => useContext(SearchStateContext);

export default useSearchState;
