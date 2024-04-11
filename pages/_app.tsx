// import '../src/wdyr';
import '@/src/index.css';
import '@/src/initFirebase';
import type { AppProps } from 'next/app';
import { Provider } from 'react-redux';
import React from 'react';
import { SearchStateProvider, useDefaultSearchState } from '@/src/context/searchState';
import store from '@/src/store';
import { ModalProvider } from '@/src/context/modal';
import { ChosenScheduleProvider } from '@/src/context/selectedSchedule';
import { useSyncAuth, useSyncUserSettings } from '@/components/Layout/useSyncAuth';
import ExpandCardsProvider from '@/src/context/expandCards';
import IncludeSemestersProvider from '@/src/context/includeSemesters';

export default function (props: AppProps) {
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
  useSyncAuth();
  useSyncUserSettings();

  return (
    <SearchStateProvider defaultState={defaultState}>
      <ExpandCardsProvider>
        <ChosenScheduleProvider>
          <IncludeSemestersProvider>
            <Component {...pageProps} />
          </IncludeSemestersProvider>
        </ChosenScheduleProvider>
      </ExpandCardsProvider>
    </SearchStateProvider>
  );
}
