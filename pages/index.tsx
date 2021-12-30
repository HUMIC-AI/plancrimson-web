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
        className="grid gap-4 sm:grid-cols-[1fr_3fr]"
      >
        <CategorySelect
          currentSearch={searchParams.search}
          search={search}
          allFacets={searchResults && !('error' in searchResults) ? searchResults.facets : []}
        />

        <div className="flex flex-col w-full border-2 border-gray-700 border-dashed p-4 rounded-xl">
          {searchError
            ? (
              <p>
                An error occurred. Please try again.
                {' '}
                <code>
                  {searchError.message}
                  {' '}
                  {searchError.info.error}
                </code>
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
