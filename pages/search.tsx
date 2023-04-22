import React, { PropsWithChildren, useEffect } from 'react';
import { Configure, InstantSearch } from 'react-instantsearch-dom';
import qs from 'qs';
import { useAppSelector, useElapsed } from '@/src/hooks';

// components
import useSearchState from '@/src/context/searchState';
import { Planner, Auth } from '@/src/features';
import Layout, { errorMessages } from '@/components/Layout/Layout';
import { ErrorMessage } from '@/components/Layout/ErrorPage';
import { LoadingBars } from '@/components/Layout/LoadingPage';
import SearchBox from '@/components/SearchComponents/SearchBox/SearchBox';
import Hits from '@/components/SearchComponents/Hits';
import CurrentRefinements from '@/components/SearchComponents/CurrentRefinements';
import SortBy from '@/components/SearchComponents/SortBy';
import { useMeiliClient } from '@/src/context/meili';
import AttributeMenu from '@/components/SearchComponents/AttributeMenu/AttributeMenu';

// we show a demo if the user is not logged in,
// but do not allow them to send requests to the database
export default function SearchPage() {
  const { setSearchState } = useSearchState();
  const showAttributes = useAppSelector(Planner.selectShowAttributes);

  // on the initial page load, we want to populate the search state from the query string
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const stateFromQuery = qs.parse(window.location.search.slice(1));
    process.nextTick(() => setSearchState((prev: any) => ({ ...prev, ...stateFromQuery })));
  }, []);

  return (
    <Layout className="mx-auto flex w-screen max-w-5xl flex-1 justify-center sm:p-8">
      <InnerPage>
        <div className={showAttributes ? 'mr-8' : 'hidden'}>
          <AttributeMenu withWrapper lgOnly />
        </div>

        <div className="space-y-4">
          <SearchBox />
          <div className="grid grid-cols-[auto_1fr] items-center gap-4">
            <SortBy />
            <CurrentRefinements />
          </div>
          <Hits />
        </div>
      </InnerPage>
    </Layout>
  );
}

/**
 * Only try to connect to MeiliSearch when the user is logged in.
 * Must be inside the layout to access the MeiliSearch context.
 */
function InnerPage({ children }: PropsWithChildren<{}>) {
  const { setSearchState, searchState } = useSearchState();
  const userId = Auth.useAuthProperty('uid');
  const { client, error } = useMeiliClient();
  const elapsed = useElapsed(3000, []);

  // ignore errors if the user is not logged in, since we just show the demo
  if (userId) {
    if (error) {
      return (
        <ErrorMessage>
          {errorMessages.meiliClient}
        </ErrorMessage>
      );
    }

    if (!client) {
      if (elapsed) return <LoadingBars />;
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
        <Configure hitsPerPage={12} />
        {children}
      </InstantSearch>
    );
  }

  // if the user isn't logged in, just show the demo
  return <>{children}</>;
}
