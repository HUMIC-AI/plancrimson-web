import React, { useEffect } from 'react';
import { Configure, InstantSearch } from 'react-instantsearch-dom';
import qs from 'qs';
import { meiliSearchClient } from '../src/hooks';

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
import { useAppSelector } from '../src/app/hooks';
import { selectUid } from '../src/features/userData';
import { selectShowAttributes } from '../src/features/semesterFormat';
import AttributeMenu from '../components/SearchComponents/AttributeMenu';

// we show a demo if the user is not logged in,
// but do not allow them to send requests to the database
const SearchPage = function () {
  const user = useAppSelector(selectUid);
  const showAttributes = useAppSelector(selectShowAttributes);
  const { searchState, setSearchState } = useSearchState();

  useEffect(() => {
    if (!user || typeof window === 'undefined') return;
    const stateFromQuery = qs.parse(window.location.search.slice(1));
    process.nextTick(() => setSearchState((prev: any) => ({ ...prev, ...stateFromQuery })));
  }, [user]);

  return (
    <Layout>
      <div className="container p-8 mx-auto">
        <InstantSearch
          indexName="courses"
          searchClient={meiliSearchClient}
          searchState={searchState}
          onSearchStateChange={(newState) => {
            setSearchState({ ...searchState, ...newState });
          }}
          stalledSearchDelay={500}
        >
          {user && <Configure hitsPerPage={12} />}
          <div className="flex space-x-4">
            <div className={showAttributes ? '' : 'hidden'}>
              <AttributeMenu />
            </div>

            <div className="flex-1 p-6 shadow-lg border-2 border-gray-300 bg-white rounded-lg space-y-4">
              {user ? <SearchBox /> : <SearchBoxDemo />}
              <div className="grid grid-cols-[auto_1fr] gap-4">
                {user ? <SortBy /> : <SortByDemo />}
                {user ? <CurrentRefinements /> : <CurrentRefinementsDemo />}
              </div>
              {user ? <Hits /> : <HitsDemo />}
            </div>
          </div>
        </InstantSearch>
      </div>
    </Layout>
  );
};

export default SearchPage;
