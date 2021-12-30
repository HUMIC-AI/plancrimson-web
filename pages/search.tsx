import React from 'react';
import { instantMeiliSearch } from '@meilisearch/instant-meilisearch';
import { InstantSearch } from 'react-instantsearch-core';
import { CurrentRefinements } from 'react-instantsearch-dom';
import Layout from '../components/Layout/Layout';
import Attribute from '../components/SearchComponents/Attribute';
import SearchBox from '../components/SearchComponents/SearchBox';
import Hits from '../components/SearchComponents/Hits';
import MeiliAttributes from '../shared/meiliAttributes.json';
import { SearchPageContextProvider } from '../src/context/searchPage';
import { ATTRIBUTE_DESCRIPTIONS, Class } from '../shared/apiTypes';

const searchClient = instantMeiliSearch(
  'http://127.0.0.1:7700',
);

const SearchPage = function () {
  return (
    <Layout>
      <InstantSearch
        indexName="courses"
        searchClient={searchClient}
      >
        {/* <Configure hitsPerPage={10} /> */}
        <div className="flex gap-2">
          <div className="flex-shrink-0 w-64 p-2 hidden md:flex flex-col gap-2 bg-gray-800 rounded-md">
            {MeiliAttributes.filterableAttributes.map((attr) => (
              <Attribute attribute={attr} key={attr} label={ATTRIBUTE_DESCRIPTIONS[attr as keyof Class] || attr} />
            ))}
          </div>
          <div className="flex-1 p-4 shadow-lg border-2 border-gray-300 rounded-lg space-y-4">
            <SearchPageContextProvider>
              <SearchBox />
              <CurrentRefinements />
              <Hits />
            </SearchPageContextProvider>
          </div>
        </div>
      </InstantSearch>
    </Layout>
  );
};

export default SearchPage;
