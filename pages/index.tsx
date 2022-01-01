import React, { useRef } from 'react';
import { instantMeiliSearch } from '@meilisearch/instant-meilisearch';
import { InstantSearch } from 'react-instantsearch-dom';
import Layout from '../components/Layout/Layout';
import Attribute from '../components/SearchComponents/Attribute';
import SearchBox from '../components/SearchComponents/SearchBox';
import Hits from '../components/SearchComponents/Hits';
import MEILI_ATTRIBUTES from '../shared/meiliAttributes.json';
import { SelectedScheduleProvider } from '../src/context/selectedSchedule';
import CurrentRefinements from '../components/SearchComponents/CurrentRefinements';
import { adjustAttr, getMeiliApiKey, getMeiliHost } from '../shared/util';
import SortBy from '../components/SearchComponents/SortBy';
import Stats from '../components/SearchComponents/Stats';
import { useLgBreakpoint } from '../src/hooks';

const searchClient = instantMeiliSearch(
  getMeiliHost(),
  getMeiliApiKey(),
);

const AttributeMenu = function () {
  const ref = useRef<HTMLDivElement>(null!);
  const isLg = useLgBreakpoint();
  return (
    <div className="flex-shrink-0 w-64 p-2 hidden lg:flex flex-col gap-2 bg-gray-800 rounded-md" ref={ref}>
      {isLg && MEILI_ATTRIBUTES.filterableAttributes.map((attr) => (
        <Attribute attribute={attr} key={attr} label={adjustAttr(attr)} />
      ))}
    </div>
  );
};

const SearchPage = function () {
  return (
    <Layout>
      <InstantSearch
        indexName="courses"
        searchClient={searchClient}
      >
        {/* <Configure hitsPerPage={10} /> */}
        <div className="flex gap-4">
          <AttributeMenu />

          <div className="flex-1 p-6 shadow-lg border-2 border-gray-200 rounded-lg space-y-4">
            <SelectedScheduleProvider>
              <SearchBox />
              <div className="flex items-start justify-between gap-4">
                <SortBy
                  defaultRefinement="courses"
                  items={[
                    { label: 'Default', value: 'courses' },
                    { label: 'Catalog number', value: 'courses:CATALOG_NBR:asc' },
                    { label: 'Start time', value: 'courses:IS_SCL_STRT_TM_DEC:asc' },
                    { label: 'Average class size', value: 'courses:meanClassSize:desc' },
                    { label: 'Workload', value: 'courses:meanClassSize:asc' },
                    { label: 'Highly Recommended', value: 'courses:meanRecommendation:desc' },
                    { label: 'Highly Rated', value: 'courses:meanRating:desc' },
                  ]}
                />
                <div className="hidden sm:block flex-1 min-w-max">
                  <Stats />
                </div>
              </div>
              <CurrentRefinements />
              <Hits />
            </SelectedScheduleProvider>
          </div>
        </div>
      </InstantSearch>
    </Layout>
  );
};

export default SearchPage;
