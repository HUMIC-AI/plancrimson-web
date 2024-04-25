// import '../src/wdyr';
import '@/src/index.css';
import '@/src/initFirebase';
import type { AppProps } from 'next/app';
import { Provider } from 'react-redux';
import React, { useEffect } from 'react';
import { SearchStateProvider, useDefaultSearchState } from '@/src/context/searchState';
import store from '@/src/store';
import { ModalProvider } from '@/src/context/modal';
import { ScheduleIdProvider } from '@/src/context/selectedSchedule';
import { useSyncAuth, useSyncUserSettings } from '@/components/Layout/useSyncAuth';
import CourseCardStyleProvider from '@/src/context/CourseCardStyleProvider';
import IncludeSemestersProvider from '@/src/context/includeSemesters';
import { getAnalytics, logEvent } from 'firebase/analytics';
import { useRouter } from 'next/router';
import { Auth } from '../src/features';

export default function App(props: AppProps) {
  return (
    <Provider store={store}>
      <ModalProvider>
        <AppWrapper {...props} />
      </ModalProvider>
    </Provider>
  );
}

function AppWrapper({ Component, pageProps }: AppProps) {
  const defaultState = useDefaultSearchState();
  const userId = Auth.useAuthProperty('uid');
  const router = useRouter();
  useSyncAuth();
  useSyncUserSettings();

  useEffect(() => {
    logEvent(getAnalytics(), 'page_view', {
      page_location: router.pathname,
      page_path: router.asPath,
      uid: userId,
    });
  }, [router, userId]);

  return (
    <SearchStateProvider defaultState={defaultState}>
      <CourseCardStyleProvider>
        <ScheduleIdProvider id={typeof router.query.selected === 'string' ? router.query.selected : null}>
          <IncludeSemestersProvider>
            <Component {...pageProps} />
          </IncludeSemestersProvider>
        </ScheduleIdProvider>
      </CourseCardStyleProvider>
    </SearchStateProvider>
  );
}
