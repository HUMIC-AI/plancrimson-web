import type { NextPage } from 'next';
import React, { useState } from 'react';
import StyledFirebaseAuth from 'react-firebaseui/StyledFirebaseAuth';
import { getAuth, GoogleAuthProvider, signOut } from 'firebase/auth';
import SemesterSchedule from '../components/SemesterSchedule/SemesterSchedule';
import YearSchedule from '../components/YearSchedule';
import CategorySelect from '../components/CategorySelect';
import ResultsTab from '../components/ResultsTab/ResultsTab';
import { UserDataProvider, useUser } from '../src/userContext';
import { useSearch } from '../src/hooks';
import Layout from '../components/Layout';

const tabs = {
  results: { title: 'Results', component: ResultsTab },
  semesterSchedule: { title: 'Semester Schedule', component: SemesterSchedule },
  yearSchedule: { title: 'Year Schedule', component: YearSchedule },
} as const;

// const FirebaseAuth = dynamic()

const Home: NextPage = function () {
  const {
    user, error: authError,
  } = useUser();
  const [tabState, setTabState] = useState<keyof typeof tabs>('results');
  const [selectedSchedule, selectSchedule] = useState<string | undefined>();
  const {
    searchParams, search, searchResults, error, loading,
  } = useSearch();

  const BodyComponent = tabs[tabState].component;
  const tabNames = Object.keys(tabs) as Array<keyof typeof tabs>;

  return (
    <Layout>
      <div className="w-full flex flex-col items-stretch space-y-4">
        {authError}

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

        <div className="flex flex-col min-h-screen gap-2 items-stretch">
          <CategorySelect
            currentSearch={searchParams.search}
            search={search}
            allFacets={searchResults ? searchResults.facets : []}
          />

          <div>
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

            {loading && <p>Loading...</p>}

            <UserDataProvider user={user}>
              <BodyComponent
                searchResults={searchResults}
                search={search}
                selectedSchedule={selectedSchedule}
                selectSchedule={selectSchedule}
              />
            </UserDataProvider>

            {error && <code>{JSON.stringify(error)}</code>}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Home;
