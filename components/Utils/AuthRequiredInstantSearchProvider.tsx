import React, { PropsWithChildren, createContext, useContext } from 'react';
import { Configure, InstantSearch } from 'react-instantsearch-dom';
import { useElapsed } from '@/src/utils/hooks';
import useSearchState, { createUrl } from '@/src/context/searchState';
import { Auth } from '@/src/features';
import { LoadingBars } from '@/components/Layout/LoadingPage';
import { useMeiliClient } from '@/src/context/meili';
import { ErrorMessage } from '../Layout/ErrorMessage';
import type { IndexName } from '../../src/lib';
import { MESSAGES } from '../../src/utils/config';

const HasInstantSearchContext = createContext<boolean>(false);

export function useHasInstantSearch() {
  return useContext(HasInstantSearchContext);
}

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
  const elapsed = useElapsed(3000, []);

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
    // to avoid flickering, we only show the loading bars after 3 seconds
    return elapsed ? <LoadingBars /> : null;
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
      <HasInstantSearchContext.Provider value>
        <Configure hitsPerPage={hitsPerPage} />
        {children}
      </HasInstantSearchContext.Provider>
    </InstantSearch>
  );
}
