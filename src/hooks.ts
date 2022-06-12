import { DependencyList, useEffect, useState } from 'react';
import { setDoc, deleteDoc } from 'firebase/firestore';
import {
  getAuth, GoogleAuthProvider, signInWithCredential, signInWithPopup, User,
} from 'firebase/auth';
import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux';
import { Schema, UserDocument } from '../shared/firestoreTypes';
import type { AppDispatch, RootState } from './store';

const LG_BREAKPOINT = 1024;

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
  return setDoc(Schema.friendRequest(from, to), {
    from,
    to,
    accepted: false,
  });
}

export function unfriend(from: string, to: string) {
  return Promise.allSettled([
    deleteDoc(Schema.friendRequest(from, to)),
    deleteDoc(Schema.friendRequest(to, from)),
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

export function useElapsed(ms: number, deps: DependencyList) {
  // timer
  const [elapsed, setElapsed] = useState(false);

  useEffect(() => {
    setElapsed(false);
    const timeout = setTimeout(() => setElapsed(true), ms);
    return () => clearTimeout(timeout);
  }, deps);

  return elapsed;
}

export async function signInUser() {
  const auth = getAuth();
  let user: User;
  if (process.env.NODE_ENV === 'development') {
    const email = prompt('Enter email:')!;
    if (!email) return;
    const sub = Buffer.from(email).toString('base64');
    const newUser = await signInWithCredential(auth, GoogleAuthProvider.credential(JSON.stringify({ sub, email })));
    user = newUser.user;
  } else {
    // we don't need any additional scopes
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({
      hd: 'college.harvard.edu',
    });
    const newUser = await signInWithPopup(auth, provider);
    user = newUser.user;
  }

  await setDoc(Schema.profile(user.uid), {
    // we assume people don't use strange characters in their academic emails
    username: user.email!.slice(0, user.email!.lastIndexOf('@')),
    displayName: user.displayName,
    photoUrl: user.photoURL,
  }, { merge: true });

  const initialDoc: UserDocument = {
    chosenSchedules: {},
    customTimes: {},
    hiddenScheduleIds: [],
    waivedRequirements: {},
  };

  await setDoc(Schema.user(user.uid), initialDoc, { merge: true });
  return user;
}

export function handleError(err: unknown) {
  alert('An unexpected error occurred! Please try again later.');
  console.error(err);
}

export function useAppDispatch() { return useDispatch<AppDispatch>(); }
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
