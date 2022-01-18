import '../src/wdyr';
import 'tailwindcss/tailwind.css';
import type { AppProps } from 'next/app';
import { getApps, initializeApp } from 'firebase/app';
import { connectFirestoreEmulator, getFirestore } from 'firebase/firestore';
// import { connectAuthEmulator, getAuth } from 'firebase/auth';
import { UserContext, UserProvider } from '../src/context/user';
import { UserDataProvider } from '../src/context/userData';
import { ClassCacheProvider } from '../src/context/classCache';
import { CardStyleProvider } from '../src/context/cardStyle';
import { SearchStateProvider } from '../src/context/searchState';

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

  // connect to emulators in development mode
  // check /firebase.json for port numbers
  if (process.env.NODE_ENV === 'development') {
    // const auth = getAuth();
    // connectAuthEmulator(auth, 'http://127.0.0.1:9099');
    const db = getFirestore();
    connectFirestoreEmulator(db, '127.0.0.1', 8080);
  }
}

const MyApp = function ({ Component, pageProps }: AppProps) {
  return (
    <UserProvider>
      <UserContext.Consumer>
        {({ user }) => (
          <UserDataProvider user={user}>
            <ClassCacheProvider>
              <CardStyleProvider>
                <SearchStateProvider>
                  <Component {...pageProps} />
                </SearchStateProvider>
              </CardStyleProvider>
            </ClassCacheProvider>
          </UserDataProvider>
        )}
      </UserContext.Consumer>
    </UserProvider>
  );
};

export default MyApp;
