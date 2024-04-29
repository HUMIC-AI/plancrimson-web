import React, { PropsWithChildren, createContext, useContext } from 'react';
import { Configure, InstantSearch } from 'react-instantsearch-dom';
import { createUrl, useSearchState } from '@/src/context/searchState';
import { Auth } from '@/src/features';
import { useMeiliClient } from '@/src/context/meili';
import { ErrorMessage } from '../Layout/ErrorMessage';
import type { IndexName } from '../../src/lib';
import { MESSAGES } from '../../src/utils/config';

const HasInstantSearchContext = createContext<'done' | 'loading' | 'none'>('none');

export const useHasInstantSearch = () => useContext(HasInstantSearchContext);

/**
 * Only try to connect to MeiliSearch when the user is logged in.
 * Must be inside the layout to access the MeiliSearch context.
 */
export function AuthRequiredInstantSearchProvider({
  indexName,
  children,
  hitsPerPage = 12,
}: PropsWithChildren<{
  indexName: IndexName;
  hitsPerPage?: number;
}>) {
  const { searchState, onSearchStateChange } = useSearchState();
  const userId = Auth.useAuthProperty('uid');
  const { client, error } = useMeiliClient();

  if (typeof userId === 'undefined') return null;

  // ignore errors if the user is not logged in, since we just show the demo
  if (!userId) return <>{children}</>;

  if (error) {
    return (
      <ErrorMessage>
        {MESSAGES.meiliClient}
      </ErrorMessage>
    );
  }

  if (!client) {
    return (
      <HasInstantSearchContext.Provider value="loading">
        {children}
      </HasInstantSearchContext.Provider>
    );
  }

  return (
    <InstantSearch
      indexName={indexName}
      searchClient={client}
      searchState={searchState}
      onSearchStateChange={onSearchStateChange}
      // automatic debouncing
      stalledSearchDelay={500}
      createURL={createUrl}
    >
      <HasInstantSearchContext.Provider value="done">
        <Configure hitsPerPage={hitsPerPage} />
        {children}
      </HasInstantSearchContext.Provider>
    </InstantSearch>
  );
}
