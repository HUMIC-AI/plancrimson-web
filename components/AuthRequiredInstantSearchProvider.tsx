import React, { PropsWithChildren } from 'react';
import { Configure, InstantSearch } from 'react-instantsearch-dom';
import { useElapsed } from '@/src/utils/hooks';
import useSearchState from '@/src/context/searchState';
import { Auth } from '@/src/features';
import { errorMessages } from '@/components/Layout/Layout';
import { ErrorMessage } from '@/components/Layout/ErrorPage';
import { LoadingBars } from '@/components/Layout/LoadingPage';
import { useMeiliClient } from '@/src/context/meili';

/**
 * Only try to connect to MeiliSearch when the user is logged in.
 * Must be inside the layout to access the MeiliSearch context.
 */
export function AuthRequiredInstantSearchProvider({
  children,
  hitsPerPage = 12,
}: PropsWithChildren<{
  hitsPerPage?: number;
}>) {
  const { setSearchState, searchState } = useSearchState();
  const userId = Auth.useAuthProperty('uid');
  const { client, error } = useMeiliClient();
  const elapsed = useElapsed(3000, []);

  if (typeof userId === 'undefined') return null;

  // ignore errors if the user is not logged in, since we just show the demo
  if (!userId) return <>{children}</>;

  if (error) {
    return (
      <ErrorMessage>
        {errorMessages.meiliClient}
      </ErrorMessage>
    );
  }

  if (!client) {
    if (elapsed) { return <LoadingBars />; }
    // to avoid flickering, we only show the loading bars after 3 seconds
    return null;
  }

  return (
    <InstantSearch
      indexName="courses"
      searchClient={client}
      searchState={searchState}
      onSearchStateChange={(newState) => {
        setSearchState({ ...searchState, ...newState });
      }}
      stalledSearchDelay={500}
    >
      <Configure hitsPerPage={hitsPerPage} />
      {children}
    </InstantSearch>
  );
}