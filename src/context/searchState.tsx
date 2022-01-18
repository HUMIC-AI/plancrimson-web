import React, {
  createContext, useContext, useMemo, useState,
} from 'react';
import { throwMissingContext } from '../../shared/util';

interface SearchStateContextType {
  searchState: any;
  setSearchState: React.Dispatch<React.SetStateAction<any>>;
}

const SearchStateContext = createContext<SearchStateContextType>({
  searchState: null,
  setSearchState: throwMissingContext,
});

export function SearchStateProvider({ children } : React.PropsWithChildren<{}>) {
  const [searchState, setSearchState] = useState({});

  const context = useMemo(() => ({
    searchState, setSearchState,
  }), [searchState]);

  return (
    <SearchStateContext.Provider value={context}>
      {children}
    </SearchStateContext.Provider>
  );
}

const useSearchState = () => useContext(SearchStateContext);

export default useSearchState;
