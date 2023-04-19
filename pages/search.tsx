import React, { useEffect } from 'react';
import { Configure, InstantSearch } from 'react-instantsearch-dom';
import qs from 'qs';
import { useAppSelector, useElapsed } from '../src/hooks';

// components
import Layout, { errorMessages } from '../components/Layout/Layout';
import { ErrorPage } from '../components/Layout/ErrorPage';
import { LoadingPage } from '../components/Layout/LoadingPage';
import SearchBox, {
  SearchBoxDemo,
} from '../components/SearchComponents/SearchBox';
import Hits, { HitsDemo } from '../components/SearchComponents/Hits';
import CurrentRefinements, {
  CurrentRefinementsDemo,
} from '../components/SearchComponents/CurrentRefinements';
import SortBy, { SortByDemo } from '../components/SearchComponents/SortBy';
import useSearchState from '../src/context/searchState';
import AttributeMenu from '../components/SearchComponents/AttributeMenu';
import { Planner, Auth } from '../src/features';
import { useMeiliClient } from '../src/meili';

// we show a demo if the user is not logged in,
// but do not allow them to send requests to the database
export default function SearchPage() {
  const userId = Auth.useAuthProperty('uid');
  const { setSearchState } = useSearchState();
  const elapsed = useElapsed(5000, []);

  useEffect(() => {
    if (!userId || typeof window === 'undefined') return;
    const stateFromQuery = qs.parse(window.location.search.slice(1));
    process.nextTick(() => setSearchState((prev: any) => ({ ...prev, ...stateFromQuery })));
  }, [userId]);

  if (typeof userId === 'undefined') {
    if (elapsed) return <LoadingPage />;
    return <Layout />;
  }

  if (userId === null) {
    return <DemoPage />;
  }

  return (
    <Layout>
      <InnerPage elapsed={elapsed} />
    </Layout>
  );
}

function InnerPage({ elapsed }: { elapsed: boolean }) {
  const showAttributes = useAppSelector(Planner.selectShowAttributes);
  const { client, error } = useMeiliClient();
  const { searchState, setSearchState } = useSearchState();

  if (error) {
    return <ErrorPage>{errorMessages.meiliClient}</ErrorPage>;
  }

  if (!client) {
    if (elapsed) return <LoadingPage />;
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
      <div className="flex space-x-4">
        <div className={showAttributes ? '' : 'hidden'}>
          <AttributeMenu withWrapper lgOnly />
        </div>

        <div className="flex-1 space-y-4 rounded-lg border-2 border-gray-300 bg-white p-6 shadow-lg">
          <SearchBox />
          <div className="grid grid-cols-[auto_1fr] gap-4">
            <SortBy />
            <CurrentRefinements />
          </div>
          <Hits />
        </div>
      </div>
    </InstantSearch>
  );
}

function DemoPage() {
  const showAttributes = useAppSelector(Planner.selectShowAttributes);

  return (
    <Layout>
      <div className="flex space-x-4">
        <div className={showAttributes ? '' : 'hidden'}>
          <AttributeMenu withWrapper lgOnly />
        </div>

        <div className="flex-1 space-y-4 rounded-lg border-2 border-gray-300 bg-white p-6 shadow-lg">
          <SearchBoxDemo />
          <div className="grid grid-cols-[auto_1fr] gap-4">
            <SortByDemo />
            <CurrentRefinementsDemo />
          </div>
          <HitsDemo />
        </div>
      </div>
    </Layout>
  );
}
