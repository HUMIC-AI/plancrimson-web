import type { NextPage } from 'next';
import React from 'react';
import CategorySelect from '../components/CategorySelect';
import ResultsTab from '../components/ResultsTab/ResultsTab';
import useSearch from '../src/hooks';
import Layout from '../components/Layout/Layout';

const Home: NextPage = function () {
  const {
    searchParams, search, searchResults, error: searchError,
  } = useSearch();

  return (
    <Layout>
      <div
        className="grid gap-4"
        style={{
          gridTemplateColumns: '1fr 3fr',
        }}
      >
        <CategorySelect
          currentSearch={searchParams.search}
          search={search}
          allFacets={searchResults ? searchResults.facets : []}
        />

        <div className="flex flex-col w-full">
          {searchError
            ? (
              <p>
                {JSON.stringify(searchError, null, 2)}
              </p>
            )
            : (
              <ResultsTab
                searchParams={searchParams}
                searchResults={searchResults}
                search={search}
              />
            )}
        </div>
      </div>
    </Layout>
  );
};

export default Home;
