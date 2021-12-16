import type { NextPage } from 'next';
import Head from 'next/head';
// import Image from 'next/image';
import axios from 'axios';
import {
  FaAngleLeft, FaAngleRight, FaSearch,
} from 'react-icons/fa';
import React, { useState } from 'react';
import courseData from '../src/courseData.json';
import { Course as CourseType, MyHarvardResponse } from '../src/types';
import SemesterSchedule from '../components/SemesterSchedule';
import Course from '../components/Course';
import YearSchedule from '../components/YearSchedule';

type SearchResults = {
  status: 'none' | 'loading' | 'error';
  data?: string | object;
} | {
  status: 'success',
  data: MyHarvardResponse;
  search: string;
  pageNumber: number;
  totalPages: number;
};

type CourseFetcher = (_: { search: string; pageNumber: number; }) => Promise<void>;

const CategorySelect = function ({ fetchCourses }: { fetchCourses: CourseFetcher }) {
  return (
    <details className="max-w-2xl space-y-2" style={{ minWidth: '16rem' }}>
      <summary className="cursor-pointer text-center rounded bg-gray-300 py-2">Find courses</summary>
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
                <ul className="p-4 rounded-b bg-gray-300 grid gap-y-1" style={{ gridTemplateColumns: 'auto auto' }}>
                  {subcategories.map(({ HU_SB_SUBCAT_DESCR: subcategoryTitle, HU_SB_SRCH_DEFN: search, HU_SB_DEPT_URL: url }) => (
                    <li key={subcategoryTitle} className="contents">
                      <span>
                        {subcategoryTitle}
                      </span>
                      <span className="flex items-center gap-4">
                        <button type="button" onClick={() => fetchCourses({ search, pageNumber: 1 })}>
                          <FaSearch />
                        </button>
                        <a href={url} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:text-blue-700">Link</a>
                      </span>
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
  searchResults, fetchCourses, mySchedule, setMySchedule,
}: {
  searchResults: SearchResults;
  fetchCourses: CourseFetcher;
  mySchedule: CourseType[];
  setMySchedule: React.Dispatch<React.SetStateAction<CourseType[]>>;
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
        <h2 className="text-2xl flex justify-between items-center mb-2">
          Results
          <span className="flex items-center">
            {searchResults.pageNumber > 1 && (
            <button type="button" onClick={() => fetchCourses({ search: searchResults.search, pageNumber: searchResults.pageNumber - 1 })}>
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
            <button type="button" onClick={() => fetchCourses({ search: searchResults.search, pageNumber: searchResults.pageNumber + 1 })}>
              <FaAngleRight />
            </button>
            )}
          </span>
        </h2>

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
  const [searchResults, setSearchResults] = useState<SearchResults>({
    status: 'none',
  });
  const [mySchedule, setMySchedule] = useState<CourseType[]>([]);
  const [tabState, setTabState] = useState<keyof typeof tabs>('results');

  const fetchCourses: CourseFetcher = async ({ search, pageNumber }) => {
    setSearchResults({ status: 'loading' });

    const result = await axios.get('/api/search', {
      params: { search, pageNumber },
    });

    if (result.status !== 200) {
      setSearchResults({
        status: 'error',
        data: result.data?.error || result.statusText,
      });
    } else if (!Array.isArray(result.data) || result.data.length === 0) {
      setSearchResults({
        status: 'error',
        data: 'An unexpected error occurred when fetching data from my.harvard',
      });
    } else {
      const data = result.data as MyHarvardResponse;
      setSearchResults({
        status: 'success',
        data,
        search,
        pageNumber,
        totalPages: data[2].TotalPages,
      });
    }
  };

  const BodyComponent = tabs[tabState].component;

  return (
    <div>
      <Head>
        <title>Harvard Concentration Planner</title>
      </Head>

      <main className="p-8 mx-auto flex flex-col items-stretch space-y-4">
        <h1 className="text-4xl text-center">Harvard Concentration Planner</h1>

        <div className="flex min-h-screen gap-2 items-stretch">
          <CategorySelect fetchCourses={fetchCourses} />

          <div className="container">
            <nav className="flex justify-between p-2 bg-gray-300 rounded w-full">
              {(Object.keys(tabs) as (keyof typeof tabs)[]).map((key) => (
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
              fetchCourses={fetchCourses}
              searchResults={searchResults}
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
