import { useEffect, useState } from 'react';
import {
  getFirestore, DocumentReference, doc, Timestamp, collection, CollectionReference, setDoc, collectionGroup, Query, deleteDoc,
} from 'firebase/firestore';
import { instantMeiliSearch } from '@meilisearch/instant-meilisearch';
import {
  getAuth, GoogleAuthProvider, signInWithCredential, signInWithPopup,
} from 'firebase/auth';
import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux';
import type { FriendRequest, Schedule, UserDocument } from '../shared/firestoreTypes';
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

export function getFriendsCollectionGroup() {
  return collectionGroup(getFirestore(), 'friends') as Query<FriendRequest>;
}

export function getFriendRequestRef(from: string, to: string) {
  return doc(getFirestore(), 'allFriends', from, 'friends', to) as DocumentReference<FriendRequest>;
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

/**
 * @param to the uid of the user to send a friend request to
 */
export function sendFriendRequest(from: string, to: string) {
  return setDoc(getFriendRequestRef(from, to), {
    from,
    to,
    accepted: false,
  });
}

export function unfriend(from: string, to: string) {
  return Promise.allSettled([
    deleteDoc(getFriendRequestRef(from, to)),
    deleteDoc(getFriendRequestRef(to, from)),
  ]);
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

export const meiliSearchClient = instantMeiliSearch(getMeiliHost(), getMeiliApiKey(), {
  paginationTotalHits: 1000,
});

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
