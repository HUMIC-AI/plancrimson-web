import 'tailwindcss/tailwind.css';
import type { AppProps } from 'next/app';
import { getApps, initializeApp } from 'firebase/app';
import { UserContextProvider } from '../src/userContext';

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: 'AIzaSyAtHudtGRcdGwEuXPnfb8Q4JjcUOYVVcEg',
  authDomain: 'harvard-concentration-planner.firebaseapp.com',
  projectId: 'harvard-concentration-planner',
  storageBucket: 'harvard-concentration-planner.appspot.com',
  messagingSenderId: '770496895607',
  appId: '1:770496895607:web:d277088377adf666664472',
  measurementId: 'G-F4RKHQJFH3',
};

if (getApps().length === 0) {
  initializeApp(firebaseConfig);
}

const MyApp = function ({ Component, pageProps }: AppProps) {
  return (
    <UserContextProvider>
      <Component {...pageProps} />
    </UserContextProvider>
  );
};

export default MyApp;
