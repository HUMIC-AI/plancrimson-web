import React from 'react';
import { useAppSelector } from '@/src/utils/hooks';
import { Auth, Planner } from '@/src/features';
import Layout from '@/components/Layout/Layout';
import SearchBox from '@/components/SearchComponents/SearchBox/SearchBox';
import Hits from '@/components/SearchComponents/Hits';
import AttributeMenu from '@/components/SearchComponents/AttributeMenu/AttributeMenu';
import { ScheduleSyncer } from '@/components/ScheduleSyncer';
import { WithMeili } from '@/components/Layout/WithMeili';
import { AuthRequiredInstantSearchProvider } from '../AuthRequiredInstantSearchProvider';
import { classNames } from '../../src/utils/styles';
import { SearchStateProvider } from '../../src/context/searchState';
import { SortingAndRefinementsGrid } from './CurrentRefinements';
import type { IndexName } from '../../src/lib';

export function SearchPage({ indexName }: { indexName: IndexName }) {
  const userId = Auth.useAuthProperty('uid');

  return (
    <Layout
      title={indexName === 'courses' ? 'Course Search' : 'Archived Courses'}
      className="mx-auto flex w-screen flex-1 justify-center px-4 sm:p-8"
    >
      <WithMeili userId={userId}>
        {userId && <ScheduleSyncer userId={userId} />}

        {indexName === 'archive' ? (
          <SearchStateProvider>
            <Contents indexName={indexName} />
          </SearchStateProvider>
        ) : (
          <Contents indexName={indexName} />
        )}
      </WithMeili>
    </Layout>
  );
}

function Contents({
  indexName,
}: { indexName: IndexName }) {
  const showAttributes = useAppSelector(Planner.selectShowAttributes);

  return (
    <AuthRequiredInstantSearchProvider indexName={indexName}>
      <div className={classNames('hidden', showAttributes && 'lg:block lg:mr-8')}>
        <AttributeMenu withWrapper lgOnly />
      </div>

      <div className="space-y-4">
        <SearchBox />
        <SortingAndRefinementsGrid indexName={indexName} />
        <Hits inSearch />
      </div>
    </AuthRequiredInstantSearchProvider>
  );
}

