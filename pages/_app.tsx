// import '../src/wdyr';
import '@/src/index.css';
import '@/src/initFirebase';
import type { AppProps } from 'next/app';
import { Provider } from 'react-redux';
import React from 'react';
import { SearchStateProvider } from '@/src/context/searchState';
import store from '@/src/store';
import { ModalProvider } from '@/src/context/modal';
import { SelectedScheduleProvider } from '@/src/context/selectedSchedule';
import { useSyncAuth, useSyncUserSettings } from '@/components/Layout/useSyncAuth';

function MyApp({ Component, pageProps }: AppProps) {
  useSyncAuth();
  useSyncUserSettings();

  return (
    <SearchStateProvider>
      <SelectedScheduleProvider>
        <Component {...pageProps} />
      </SelectedScheduleProvider>
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
