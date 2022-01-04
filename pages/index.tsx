import React from 'react';
import { instantMeiliSearch } from '@meilisearch/instant-meilisearch';
import { Configure, InstantSearch } from 'react-instantsearch-dom';
import { adjustAttr, getMeiliApiKey, getMeiliHost } from '../shared/util';
import MEILI_ATTRIBUTES from '../shared/meiliAttributes.json';
import { useLgBreakpoint } from '../src/hooks';
import { SelectedScheduleProvider } from '../src/context/selectedSchedule';
import useUser, { alertSignIn } from '../src/context/user';
import sampleCourses from '../components/SearchComponents/sampleCourses.json';

// components
import Layout from '../components/Layout/Layout';
import Attribute from '../components/SearchComponents/Attribute';
import SearchBox, {
  SearchBoxComponent,
} from '../components/SearchComponents/SearchBox';
import Hits, { HitsComponent } from '../components/SearchComponents/Hits';
import CurrentRefinements, {
  CurrentRefinementsComponent,
} from '../components/SearchComponents/CurrentRefinements';
import SortBy, { SortByComponent } from '../components/SearchComponents/SortBy';
import Stats, { StatsComponent } from '../components/SearchComponents/Stats';
import { DAY_SHORT } from '../shared/apiTypes';

const meiliSearchClient = instantMeiliSearch(getMeiliHost(), getMeiliApiKey());

const AttributeMenu = function () {
  const isLg = useLgBreakpoint();

  return (
    <div className="flex-shrink-0 self-start w-64 p-2 hidden lg:flex flex-col gap-2 from-gray-800 to-blue-900 bg-gradient-to-br rounded-md">
      {isLg
        && MEILI_ATTRIBUTES.filterableAttributes.map((attr) => (
          <Attribute attribute={attr} key={attr} label={adjustAttr(attr)} />
        ))}
    </div>
  );
};

// we show a demo if the user is not logged in,
// but do not allow them to send requests to the database
const SearchPage = function () {
  const { user } = useUser();

  return (
    <Layout>
      <InstantSearch indexName="courses" searchClient={meiliSearchClient}>
        {user && <Configure hitsPerPage={12} />}
        <div className="flex gap-4">
          <AttributeMenu />

          <div className="flex-1 p-6 shadow-lg border-2 border-gray-300 rounded-lg space-y-4">
            <SelectedScheduleProvider>
              {user ? (
                <SearchBox />
              ) : (
                <SearchBoxComponent
                  isSearchStalled={false}
                  refine={alertSignIn}
                  currentRefinement="Search now"
                />
              )}
              <div className="flex items-start justify-between gap-4">
                {user ? (
                  <SortBy
                    defaultRefinement="courses"
                    items={[
                      { label: 'Relevant', value: 'courses' },
                      {
                        label: 'Catalog number',
                        value: 'courses:CATALOG_NBR:asc',
                      },
                      {
                        label: 'Popularity',
                        value: 'courses:meanClassSize:desc',
                      },
                      {
                        label: 'Light Workload',
                        value: 'courses:meanClassSize:asc',
                      },
                      {
                        label: 'Highly Recommended',
                        value: 'courses:meanRecommendation:desc',
                      },
                      {
                        label: 'Highly Rated',
                        value: 'courses:meanRating:desc',
                      },
                    ]}
                  />
                ) : (
                  <SortByComponent
                    items={[
                      { label: 'Relevant', value: 'courses', isRefined: true },
                      {
                        label: 'Catalog number',
                        value: 'courses:CATALOG_NBR:asc',
                        isRefined: false,
                      },
                      {
                        label: 'Popularity',
                        value: 'courses:meanClassSize:desc',
                        isRefined: false,
                      },
                      {
                        label: 'Light Workload',
                        value: 'courses:meanClassSize:asc',
                        isRefined: false,
                      },
                      {
                        label: 'Highly Recommended',
                        value: 'courses:meanRecommendation:desc',
                        isRefined: false,
                      },
                      {
                        label: 'Highly Rated',
                        value: 'courses:meanRating:desc',
                        isRefined: false,
                      },
                    ]}
                    refine={alertSignIn}
                  />
                )}
                <div className="hidden sm:block">
                  {user ? (
                    <Stats />
                  ) : (
                    <StatsComponent nbHits={10000} processingTimeMS={200} />
                  )}
                </div>
              </div>
              {user ? (
                <CurrentRefinements />
              ) : (
                <CurrentRefinementsComponent items={[]} refine={alertSignIn} />
              )}
              {user ? (
                <Hits />
              ) : (
                <HitsComponent
                  hits={sampleCourses
                    // oh, the things i do for typescript
                    .map((course) => ({
                      ...course,
                      ...Object.assign(
                        {},
                        ...DAY_SHORT.map((attr) => ({
                          [attr]: course[attr] as 'Y' | 'N',
                        })),
                      ),
                    }))}
                  hasMore
                  hasPrevious={false}
                  refineNext={alertSignIn}
                  refinePrevious={alertSignIn}
                  inSearch={false}
                />
              )}
            </SelectedScheduleProvider>
          </div>
        </div>
      </InstantSearch>
    </Layout>
  );
};

export default SearchPage;
