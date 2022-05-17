import { useEffect, useState } from 'react';
import {
  getFirestore, DocumentReference, doc, Timestamp, collection, CollectionReference,
} from 'firebase/firestore';
import { instantMeiliSearch } from '@meilisearch/instant-meilisearch';
import {
  getAuth, GoogleAuthProvider, signInWithCredential, signInWithPopup,
} from 'firebase/auth';
import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux';
import type { Schedule, UserDocument } from '../shared/firestoreTypes';
import { getMeiliHost, getMeiliApiKey } from '../shared/util';
import type { AppDispatch, RootState } from './store';

const LG_BREAKPOINT = 1024;

export function getUserRef(uid: string) {
  return doc(getFirestore(), 'users', uid) as DocumentReference<Partial<UserDocument<Timestamp>>>;
}

export function getScheduleRef(scheduleUid: string) {
  return doc(getFirestore(), 'schedules', scheduleUid) as DocumentReference<Schedule>;
}

export function getSchedulesRef() {
  return collection(getFirestore(), 'schedules') as CollectionReference<Schedule>;
}

export function downloadJson(filename: string, data: object | string, extension = 'json') {
  if (typeof window === 'undefined') return;
  const dataStr = `data:text/json;charset=utf-8,${encodeURIComponent(
    typeof data === 'string' ? data : JSON.stringify(data),
  )}`;
  const a = document.createElement('a');
  a.setAttribute('href', dataStr);
  a.setAttribute('download', `${filename}.${extension}`);
  document.body.appendChild(a);
  a.click();
  a.remove();
}

export function useLgBreakpoint() {
  const [isPast, setIsPast] = useState(false);

  useEffect(() => {
    if (!window) return; // ignore on server

    function handleResize(this: Window) {
      setIsPast(this.innerWidth >= LG_BREAKPOINT);
    }

    setIsPast(window.innerWidth >= LG_BREAKPOINT);

    window.addEventListener('resize', handleResize);

    // eslint-disable-next-line consistent-return
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return isPast;
}

export const meiliSearchClient = instantMeiliSearch(getMeiliHost(), getMeiliApiKey());

export async function signInUser() {
  const auth = getAuth();
  if (process.env.NODE_ENV === 'development') {
    const email = prompt('Enter email:');
    if (!email) return;
    const sub = Buffer.from(email).toString('base64');
    await signInWithCredential(auth, GoogleAuthProvider.credential(JSON.stringify({ sub, email })));
    return;
  }

  // we don't need any additional scopes
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({
    hd: 'college.harvard.edu',
  });
  await signInWithPopup(auth, provider);
}

export function handleError(err: unknown) {
  alert('An unexpected error occurred! Please try again later.');
  console.error(err);
}

export function useAppDispatch() { return useDispatch<AppDispatch>(); }
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
