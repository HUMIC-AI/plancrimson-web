import React from 'react';
import { useAppSelector } from '@/src/utils/hooks';
import { Auth, Planner } from '@/src/features';
import Layout from '@/components/Layout/Layout';
import SearchBox from '@/components/SearchComponents/SearchBox/SearchBox';
import Hits from '@/components/SearchComponents/Hits';
import CurrentRefinements from '@/components/SearchComponents/CurrentRefinements';
import SortBy from '@/components/SearchComponents/SortBy';
import AttributeMenu from '@/components/SearchComponents/AttributeMenu/AttributeMenu';
import { ScheduleSyncer } from '@/components/ScheduleSyncer';
import { WithMeili } from '@/components/Layout/WithMeili';
import { AuthRequiredInstantSearchProvider } from '../AuthRequiredInstantSearchProvider';
import { classNames } from '../../src/utils/styles';

export function SearchPage({ indexName }: { indexName: 'courses' | 'archive' }) {
  const userId = Auth.useAuthProperty('uid');
  const showAttributes = useAppSelector(Planner.selectShowAttributes);

  return (
    <Layout
      title={indexName === 'courses' ? 'Course Search' : 'Archived Courses'}
      className="mx-auto flex w-screen flex-1 justify-center px-4 sm:p-8"
    >
      <WithMeili userId={userId}>
        {userId && <ScheduleSyncer userId={userId} />}

        <AuthRequiredInstantSearchProvider indexName={indexName}>
          <div className={classNames('hidden', showAttributes && 'lg:block lg:mr-8')}>
            <AttributeMenu withWrapper lgOnly />
          </div>

          <div className="space-y-4">
            <SearchBox />
            <div className="grid grid-cols-[auto_1fr] items-center gap-4">
              <SortBy indexName={indexName} />
              <CurrentRefinements />
            </div>
            <Hits inSearch />
          </div>
        </AuthRequiredInstantSearchProvider>
      </WithMeili>
    </Layout>
  );
}


