import React from 'react';
import {
  InstantSearch, Highlight,
} from 'react-instantsearch-dom';
import { instantMeiliSearch } from '@meilisearch/instant-meilisearch';
import { connectHits, connectSearchBox } from 'react-instantsearch-core';
import { Class } from '../shared/apiTypes';
import Layout from '../components/Layout/Layout';

const searchClient = instantMeiliSearch(
  'http://127.0.0.1:7700',
);

const Hits = connectHits<Class>(({ hits }) => (
  <div className="w-full flex flex-col gap-4">
    {hits.map((hit) => (
      <div className="bg-gray-300 rounded p-2 shadow">
        <h3 className="font-bold">
          <Highlight attribute="Title" hit={hit} />
        </h3>
        <p className="text-blue-700">{hit.SUBJECT + hit.CATALOG_NBR}</p>
        <p className="text-sm">
          {hit.textDescription || hit.IS_SCL_DESCR}
        </p>
      </div>
    ))}
  </div>
));

const CustomSearchBox = connectSearchBox(({ currentRefinement, isSearchStalled, refine }) => (
  <div>
    <input
      type="search"
      placeholder="Search courses"
      autoComplete="off"
      autoCapitalize="off"
      autoCorrect="off"
      spellCheck="false"
      value={currentRefinement}
      onChange={(ev) => refine(ev.currentTarget.value)}
      maxLength={512}
      required
      className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-lg transition-shadow"
    />
    {isSearchStalled && <p className="mt-2">Loading...</p>}
  </div>
));

const Search = function () {
  return (
    <Layout>
      <InstantSearch
        indexName="courses"
        searchClient={searchClient}
      >
        <div className="mx-auto max-w-lg p-4 shadow-lg border-2 border-gray-300 rounded-lg space-y-4">
          <CustomSearchBox />
          <Hits />
        </div>
      </InstantSearch>
    </Layout>
  );
};

export default Search;
