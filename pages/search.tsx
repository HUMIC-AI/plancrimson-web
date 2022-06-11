import React, { useEffect } from 'react';
import { Configure, InstantSearch } from 'react-instantsearch-dom';
import qs from 'qs';
import { meiliSearchClient, useAppSelector } from '../src/hooks';

// components
import Layout from '../components/Layout/Layout';
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

// we show a demo if the user is not logged in,
// but do not allow them to send requests to the database
export default function SearchPage() {
  const userId = Auth.useAuthProperty('uid');
  const showAttributes = useAppSelector(Planner.selectShowAttributes);
  const { searchState, setSearchState } = useSearchState();

  useEffect(() => {
    if (!userId || typeof window === 'undefined') return;
    const stateFromQuery = qs.parse(window.location.search.slice(1));
    process.nextTick(() => setSearchState((prev: any) => ({ ...prev, ...stateFromQuery })));
  }, [userId]);

  return (
    <Layout>
      <InstantSearch
        indexName="courses"
        searchClient={meiliSearchClient}
        searchState={searchState}
        onSearchStateChange={(newState) => {
          setSearchState({ ...searchState, ...newState });
        }}
        stalledSearchDelay={500}
      >
        {userId && <Configure hitsPerPage={12} />}
        <div className="flex space-x-4">
          <div className={showAttributes ? '' : 'hidden'}>
            <AttributeMenu withWrapper lgOnly />
          </div>

          <div className="flex-1 p-6 shadow-lg border-2 border-gray-300 bg-white rounded-lg space-y-4">
            {userId ? <SearchBox /> : <SearchBoxDemo />}
            <div className="grid grid-cols-[auto_1fr] gap-4">
              {userId ? <SortBy /> : <SortByDemo />}
              {userId ? <CurrentRefinements /> : <CurrentRefinementsDemo />}
            </div>
            {userId ? <Hits /> : <HitsDemo />}
          </div>
        </div>
      </InstantSearch>
    </Layout>
  );
}
