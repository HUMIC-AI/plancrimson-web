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
import { AuthRequiredInstantSearchProvider } from '../components/AuthRequiredInstantSearchProvider';

export default function SearchPage() {
  const userId = Auth.useAuthProperty('uid');
  const showAttributes = useAppSelector(Planner.selectShowAttributes);

  return (
    <Layout
      title="Search"
      className="mx-auto flex w-screen max-w-5xl flex-1 justify-center sm:p-8"
    >
      {userId && <ScheduleSyncer userId={userId} />}

      <AuthRequiredInstantSearchProvider>
        <div className={showAttributes ? 'mr-8' : 'hidden'}>
          <AttributeMenu withWrapper lgOnly />
        </div>

        <div className="space-y-4">
          <SearchBox />
          <div className="grid grid-cols-[auto_1fr] items-center gap-4">
            <SortBy />
            <CurrentRefinements />
          </div>
          <Hits />
        </div>
      </AuthRequiredInstantSearchProvider>
    </Layout>
  );
}


