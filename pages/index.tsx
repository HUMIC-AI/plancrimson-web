import type { NextPage } from 'next';
import Head from 'next/head';
import axios from 'axios';
import {
  FaAngleLeft, FaAngleRight,
} from 'react-icons/fa';
import React, { useEffect, useState } from 'react';
import courseData from '../src/courseData.json';
import { Facet, MyHarvardResponse } from '../src/types';
import SemesterSchedule from '../components/SemesterSchedule';
import Course, { ScheduleEntry } from '../components/Course';
import YearSchedule from '../components/YearSchedule';

type SearchResultsPayload = {
  data: MyHarvardResponse;
  search: string;
  pageNumber: number;
  totalPages: number;
};

type SearchResults =
  | {
    status: 'none' | 'error';
    data?: string | object;
  }
  | ({ status: 'success' } & SearchResultsPayload)
  | ({ status: 'loading' } & Partial<SearchResultsPayload>); // when loading, the entries store the past data

type SearchParams = {
  search: string;
  pageNumber: number;
  facets?: Array<string>;
};

const CategorySelect = function ({ currentSearch, setSearchParams, allFacets }: {
  currentSearch?: string;
  setSearchParams: React.Dispatch<React.SetStateAction<SearchParams | null>>;
  allFacets: Array<Facet>;
}) {
  return (
    <details className="max-w-2xl space-y-2" style={{ minWidth: '16rem' }}>
      <summary className="cursor-pointer text-center rounded bg-gray-300 py-2">Find courses</summary>

      {allFacets.length > 0 && (
      <details className="border-black border-2 py-2 px-4 rounded-lg">
        <summary className="text-xl cursor-pointer">Filters</summary>
        <hr className="border-black my-2" />
        {allFacets
          .map(({
            FacetLabel: title, FacetChildCollection: filters, Selected: selected, ...rest
          }) => ({
            title, filters, selected, ...rest,
          }))
          .filter(({ title, filters, selected }) => title !== 'Category' && ((filters && filters.length > 0) || selected))
          .map(({
            title, filters, selected, FacetName, FacetValue, DisplayValue,
          }) => (
            <div key={title}>
              <h3>{title}</h3>
              {selected
                ? (
                  <li>
                    <button
                      type="button"
                      onClick={() => setSearchParams((prev) => ({
                        ...prev!,
                        facets: prev!.facets ? prev!.facets.filter((facet) => facet !== `${FacetName}:${FacetValue}:${title}`) : [],
                      }))}
                      className="bg-blue-300 hover:bg-red-300 transition-colors"
                    >
                      {DisplayValue}
                    </button>
                  </li>
                )
                : filters!.map(({
                  DisplayValue: childTitle, FacetName: childFacetName, FacetValue: childFacetValue, FacetLabel: childFacetLabel, Count,
                }) => (
                  <li key={childTitle}>
                    <button
                      type="button"
                      onClick={() => setSearchParams((prev) => ({
                        ...prev!,
                        facets: [...(prev!.facets || []), `${childFacetName}:${childFacetValue}:${childFacetLabel}`],
                      }))}
                      className={`text-left rounded transition-colors ${filters!.length === 1 ? 'line-through cursor-not-allowed' : 'hover:bg-gray-500'}`}
                      disabled={filters!.length === 1}
                    >
                      {`${childTitle} (${Count})`}
                    </button>
                  </li>
                ))}
            </div>
          ))}
      </details>
      )}

      {courseData.map(({ HU_SB_ACAD_CAREER: acronym, DESCR: title, HU_SB_CFG_CT_VW: categories }) => (
        <details key={title} className="border-black border-2 py-2 px-4 rounded-lg">
          <summary className="text-xl cursor-pointer">
            {`${title} (${acronym})`}
          </summary>
          <hr className="border-black my-2" />
          <div className="space-y-2 px-2">
            {categories.map(({ HU_SB_CAT_DESCR: categoryTitle, HU_SB_CFG_SC_VW: subcategories }) => (
              <details key={categoryTitle}>
                <summary className="text-xl cursor-pointer">
                  {categoryTitle}
                </summary>
                <hr className="border-black mt-2" />
                <ul className="p-2 rounded-b bg-gray-300 grid gap-x-2" style={{ gridTemplateColumns: 'auto auto' }}>
                  {subcategories.map(({ HU_SB_SUBCAT_DESCR: subcategoryTitle, HU_SB_SRCH_DEFN: search, HU_SB_DEPT_URL: url }) => (
                    <li key={subcategoryTitle} className="contents">
                      <button
                        type="button"
                        onClick={() => setSearchParams((prev) => ({ ...prev, search, pageNumber: 1 }))}
                        className={`text-left pl-1 rounded transition-colors ${search === currentSearch ? 'bg-blue-300 hover:bg-red-300' : 'hover:bg-gray-500'}`}
                      >
                        {subcategoryTitle}
                      </button>
                      <a href={url} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:text-blue-700">Link</a>
                    </li>
                  ))}
                </ul>
              </details>
            ))}
          </div>
        </details>
      ))}
    </details>
  );
};

const ResultsTab = function ({
  searchResults, setSearchParams, mySchedule, setMySchedule,
}: {
  searchResults: SearchResults;
  setSearchParams: React.Dispatch<React.SetStateAction<SearchParams | null>>;
  mySchedule: Array<ScheduleEntry>;
  setMySchedule: React.Dispatch<React.SetStateAction<Array<ScheduleEntry>>>;
}) {
  return (
    <div>
      {searchResults.status === 'loading' && <p>Loading...</p>}

      {searchResults.status === 'error' && (
      <p>
        An error occurred fetching data:
        {' '}
        {searchResults.data}
      </p>
      )}

      {searchResults.status === 'success' && (
      <section>
        {' '}
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-xl">
            Results
          </h2>
          {`${searchResults.data[2].HitCount} total`}
          <span className="flex items-center">
            {searchResults.pageNumber > 1 && (
            <button type="button" onClick={() => setSearchParams((prev) => ({ ...prev, search: searchResults.search, pageNumber: searchResults.pageNumber - 1 }))}>
              <FaAngleLeft />
            </button>
            )}
            <a
              href={`data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(searchResults.data[0].ResultsCollection))}`}
              download="courses.json"
            >
              Download
            </a>
            {searchResults.pageNumber < searchResults.totalPages && (
            <button type="button" onClick={() => setSearchParams((prev) => ({ ...prev, search: searchResults.search, pageNumber: searchResults.pageNumber + 1 }))}>
              <FaAngleRight />
            </button>
            )}
          </span>
        </div>

        <div className="space-y-4">
          {searchResults.data[0].ResultsCollection.map((course) => (
            <Course
              key={course.Key}
              course={course}
              mySchedule={mySchedule}
              setMySchedule={setMySchedule}
            />
          ))}
        </div>
      </section>
      )}
    </div>
  );
};

const tabs = {
  results: { title: 'Results', component: ResultsTab },
  semesterSchedule: { title: 'Semester Schedule', component: SemesterSchedule },
  yearSchedule: { title: 'Year Schedule', component: YearSchedule },
} as const;

const Home: NextPage = function () {
  const [searchParams, setSearchParams] = useState<SearchParams | null>(null);
  const [searchResults, setSearchResults] = useState<SearchResults>({
    status: 'none',
  });
  const [mySchedule, setMySchedule] = useState<Array<ScheduleEntry>>([]);
  const [tabState, setTabState] = useState<keyof typeof tabs>('results');

  useEffect(() => {
    if (searchParams === null || searchResults.status === 'loading') return;

    setSearchResults((prev) => ({
      ...prev,
      data: prev.status === 'success' || prev.status === 'loading' ? prev.data : undefined,
      status: 'loading',
    }));

    axios.post('/api/search', searchParams).then((result) => {
      if (result.status !== 200) {
        setSearchResults((prev) => ({
          ...prev,
          status: 'error',
          data: result.data?.error || result.statusText,
        }));
      } else if (!Array.isArray(result.data) || result.data.length === 0) {
        setSearchResults((prev) => ({
          ...prev,
          status: 'error',
          data: 'An unexpected error occurred when fetching data from my.harvard',
        }));
      } else {
        const data = result.data as MyHarvardResponse;
        setSearchResults({
          status: 'success',
          data,
          search: searchParams.search,
          pageNumber: searchParams.pageNumber,
          totalPages: data[2].TotalPages,
        });
      }
    }).catch((err) => setSearchResults({ status: 'error', data: err.message }));
  }, [searchParams]);

  const BodyComponent = tabs[tabState].component;
  const tabNames = Object.keys(tabs) as Array<keyof typeof tabs>;

  return (
    <div>
      <Head>
        <title>Harvard Concentration Planner</title>
      </Head>

      <main className="p-8 mx-auto flex flex-col items-stretch space-y-4">
        <h1 className="text-4xl text-center">Harvard Concentration Planner</h1>

        <div className="flex min-h-screen gap-2 items-stretch">
          <CategorySelect
            currentSearch={searchParams?.search}
            setSearchParams={setSearchParams}
            allFacets={(searchResults.status === 'success' || searchResults.status === 'loading') && searchResults.data
              ? searchResults.data[1].Facets : []}
          />

          <div className="container">
            {/* header */}
            <nav className="flex justify-between p-2 bg-gray-300 rounded w-full">
              {tabNames.map((key) => (
                <button
                  key={key}
                  type="button"
                  className={`cursor-pointer border-b-2 border-gray-700 hover:border-black ${tabState === key && 'bg-gray-500'}`}
                  onClick={() => setTabState(key)}
                >
                  {tabs[key].title}
                </button>
              ))}
            </nav>

            <BodyComponent
              searchResults={searchResults}
              setSearchParams={setSearchParams}
              mySchedule={mySchedule}
              setMySchedule={setMySchedule}
            />
          </div>
        </div>
      </main>
    </div>
  );
};

export default Home;
