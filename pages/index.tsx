import type { NextPage } from 'next';
import Head from 'next/head';
// import dynamic from 'next/dynamic';
import axios from 'axios';
import React, {
  useEffect, useState,
} from 'react';
import StyledFirebaseAuth from 'react-firebaseui/StyledFirebaseAuth';
import { getAuth, GoogleAuthProvider, signOut } from 'firebase/auth';
import { MyHarvardResponse } from '../src/types';
import SemesterSchedule from '../components/SemesterSchedule';
import YearSchedule from '../components/YearSchedule';
import CategorySelect, { SearchParams } from '../components/CategorySelect';
import ResultsTab, { SearchResults } from '../components/ResultsTab';
import { useUser } from '../src/userContext';

const tabs = {
  results: { title: 'Results', component: ResultsTab },
  semesterSchedule: { title: 'Semester Schedule', component: SemesterSchedule },
  yearSchedule: { title: 'Year Schedule', component: YearSchedule },
} as const;

// const FirebaseAuth = dynamic()

const Home: NextPage = function () {
  const {
    user, dataError, schedule, error,
  } = useUser();
  const [searchParams, setSearchParams] = useState<SearchParams | null>(null);
  const [searchResults, setSearchResults] = useState<SearchResults>({
    status: 'none',
  });
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
      <pre>{JSON.stringify(schedule, null, 2)}</pre>

      <main className="p-8 mx-auto flex flex-col items-stretch space-y-4">
        <h1 className="text-4xl text-center">Harvard Concentration Planner</h1>

        {dataError?.message}
        {error}

        {user
          ? (
            <button
              type="button"
              className="bg-blue-300 rounded hover:bg-blue-500 transition-colors"
              onClick={() => {
                signOut(getAuth());
              }}
            >
              Sign out
            </button>
          )
          : (
            <StyledFirebaseAuth
              uiConfig={{
                signInOptions: [GoogleAuthProvider.PROVIDER_ID],
                callbacks: {
                  signInSuccessWithAuthResult: () => false,
                },
              }}
              firebaseAuth={getAuth()}
            />
          )}

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
            />
          </div>
        </div>
      </main>
    </div>
  );
};

export default Home;
