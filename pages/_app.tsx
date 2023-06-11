// import '../src/wdyr';
import '@/src/index.css';
import '@/src/initFirebase';
import type { AppProps } from 'next/app';
import { Provider } from 'react-redux';
import React from 'react';
import { SearchStateProvider, getDefaultSearchStateForSemester } from '@/src/context/searchState';
import store from '@/src/store';
import { ModalProvider } from '@/src/context/modal';
import { ChosenScheduleProvider } from '@/src/context/selectedSchedule';
import { useSyncAuth, useSyncUserSettings } from '@/components/Layout/useSyncAuth';
import { getCurrentSemester } from '@/src/lib';

function MyApp({ Component, pageProps }: AppProps) {
  useSyncAuth();
  useSyncUserSettings();

  return (
    <SearchStateProvider defaultState={getDefaultSearchStateForSemester(getCurrentSemester())}>
      <ChosenScheduleProvider>
        <Component {...pageProps} />
      </ChosenScheduleProvider>
    </SearchStateProvider>
  );
}

export default function Wrapper(props: AppProps) {
  return (
    <Provider store={store}>
      <ModalProvider>
        <MyApp {...props} />
      </ModalProvider>
    </Provider>
  );
}
