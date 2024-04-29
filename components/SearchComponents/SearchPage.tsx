import React, { useMemo } from 'react';
import { useAppSelector } from '@/src/utils/hooks';
import { Auth, Planner } from '@/src/features';
import Layout from '@/components/Layout/Layout';
import SearchBox from '@/components/SearchComponents/SearchBox/SearchBox';
import Hits from '@/components/SearchComponents/Hits';
import AttributeMenu from '@/components/SearchComponents/AttributeMenu/AttributeMenu';
import { ScheduleSyncer } from '@/components/Utils/ScheduleSyncer';
import { WithMeili } from '@/components/Layout/WithMeili';
import { AuthRequiredInstantSearchProvider } from '../Utils/AuthRequiredInstantSearchProvider';
import { classNames } from '../../src/utils/styles';
import { SearchStateProvider } from '../../src/context/searchState';
import { SortingAndRefinementsGrid } from './CurrentRefinements';
import type { IndexName } from '../../src/lib';
import { signInUser } from '../Layout/useSyncAuth';
import CourseCardStyleProvider from '../../src/context/CourseCardStyleProvider';

export function SearchPage({ indexName }: { indexName: IndexName }) {
  const userId = Auth.useAuthProperty('uid');
  // not sure if memoing this is necessary to avoid rerenders
  const defaultState = useMemo(() => ({}), []);

  return (
    <Layout
      title={indexName === 'courses' ? 'Course Search' : 'Archived Courses'}
      className="mx-auto flex w-screen flex-1 justify-center px-4 sm:p-8"
    >
      <CourseCardStyleProvider columns={4} defaultStyle="expanded">
        <WithMeili userId={userId}>
          {userId && <ScheduleSyncer userId={userId} />}

          {indexName === 'archive' ? (
          // create a new search state so that we don't override the main search state
            <SearchStateProvider defaultState={defaultState}>
              <Contents indexName={indexName} />
            </SearchStateProvider>
          ) : (
            <Contents indexName={indexName} />
          )}
        </WithMeili>
      </CourseCardStyleProvider>
    </Layout>
  );
}

function Contents({
  indexName,
}: { indexName: IndexName }) {
  const userId = Auth.useAuthProperty('uid');
  const showAttributes = useAppSelector(Planner.selectShowAttributes);

  return (
    <AuthRequiredInstantSearchProvider indexName={indexName}>
      <div className={classNames('hidden', showAttributes && 'lg:block lg:mr-8')}>
        <AttributeMenu withWrapper lgOnly />
      </div>

      <div className="space-y-4">
        {!userId && (
        <button type="button" onClick={signInUser} className="button secondary w-full">
          Log in to search for courses!
        </button>
        )}
        <SearchBox />
        <SortingAndRefinementsGrid indexName={indexName} />
        <Hits />
      </div>
    </AuthRequiredInstantSearchProvider>
  );
}

