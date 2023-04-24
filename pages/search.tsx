import React, { useEffect, useMemo } from 'react';
import qs from 'qs';
import { useAppSelector } from '@/src/utils/hooks';

// components
import useSearchState from '@/src/context/searchState';
import { Auth, Planner } from '@/src/features';
import Layout from '@/components/Layout/Layout';
import SearchBox from '@/components/SearchComponents/SearchBox/SearchBox';
import Hits from '@/components/SearchComponents/Hits';
import CurrentRefinements from '@/components/SearchComponents/CurrentRefinements';
import SortBy from '@/components/SearchComponents/SortBy';
import AttributeMenu from '@/components/SearchComponents/AttributeMenu/AttributeMenu';
import useSyncSchedulesMatchingContraints from '@/src/utils/schedules';
import { where } from 'firebase/firestore';
import { AuthRequiredInstantSearchProvider } from '../components/AuthRequiredInstantSearchProvider';

// we show a demo if the user is not logged in,
// but do not allow them to send requests to the database
export default function SearchPage() {
  const { setSearchState } = useSearchState();
  const showAttributes = useAppSelector(Planner.selectShowAttributes);
  const userId = Auth.useAuthProperty('uid');
  const constraints = useMemo(() => (userId ? [where('ownerUid', '==', userId)] : null), [userId]);
  useSyncSchedulesMatchingContraints(constraints);

  // on the initial page load, we want to populate the search state from the query string
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const stateFromQuery = qs.parse(window.location.search.slice(1));
    process.nextTick(() => setSearchState((prev: any) => ({ ...prev, ...stateFromQuery })));
  }, []);

  return (
    <Layout className="mx-auto flex w-screen max-w-5xl flex-1 justify-center sm:p-8">
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


