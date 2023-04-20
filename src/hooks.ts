import {
  DependencyList, useEffect, useMemo, useState,
} from 'react';
import {
  setDoc, deleteDoc, getDoc, onSnapshot, query, where,
} from 'firebase/firestore';
import {
  getAuth, GoogleAuthProvider, signInWithCredential, signInWithPopup, User,
} from 'firebase/auth';
import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux';
import { allTruthy } from 'plancrimson-utils';
import type { AppDispatch, RootState } from './store';
import Firestore from './schema';
import { getInitialSettings } from './utils';
import { FriendRequest, UserProfile, WithId } from './types';


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
  return setDoc(Firestore.friendRequest(from, to), {
    from,
    to,
    accepted: false,
  });
}


export function unfriend(from: string, to: string) {
  return Promise.allSettled([
    deleteDoc(Firestore.friendRequest(from, to)),
    deleteDoc(Firestore.friendRequest(to, from)),
  ]);
}


export function useBreakpoint(breakpoint: number) {
  const [isPast, setIsPast] = useState(false);

  useEffect(() => {
    if (!window) return; // ignore on server

    function handleResize(this: Window) {
      setIsPast(this.innerWidth >= breakpoint);
    }

    setIsPast(window.innerWidth >= breakpoint);

    window.addEventListener('resize', handleResize);

    // eslint-disable-next-line consistent-return
    return () => window.removeEventListener('resize', handleResize);
  }, [breakpoint]);

  return isPast;
}


export function useElapsed(ms: number, deps: DependencyList) {
  // timer
  const [elapsed, setElapsed] = useState(false);

  useEffect(() => {
    setElapsed(false);
    const timeout = setTimeout(() => setElapsed(true), ms);
    return () => clearTimeout(timeout);
  }, [...deps, ms]);

  return elapsed;
}


export async function signInUser() {
  const auth = getAuth();
  let user: User;
  if (process.env.NODE_ENV === 'development') {
    const email = prompt('In development mode. Enter email:')!;
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
    const newUser = await signInWithPopup(auth, provider).catch((err) => console.error('error signing in with popup:', err));
    if (!newUser) return;
    user = newUser.user;
  }

  await setDoc(Firestore.profile(user.uid), {
    // we assume people don't use strange characters in their academic emails
    username: user.email!.slice(0, user.email!.lastIndexOf('@')),
    displayName: user.displayName,
    photoUrl: user.photoURL,
  }, { merge: true });

  await setDoc(Firestore.user(user.uid), getInitialSettings(), { merge: true });
  return user;
}


/**
 * Checks for cached user data in the session storage. If not found,
 * get it from Firestore and save it to session storage.
 * @param id the user id to query for
 * @throws Error if invalid cached value or user not found
 * @returns their profile data
 */
export async function getProfile(id: string): Promise<WithId<UserProfile>> {
  const cached = sessionStorage.getItem(`profile/${id}`);
  if (cached) {
    try {
      const data = JSON.parse(cached);
      if (data === null) throw new Error('invalid json');
      return data;
    } catch (err) {
      console.error('invalid cached value:', cached);
    }
  }

  const snap = await getDoc(Firestore.profile(id));
  if (!snap.exists()) {
    throw new Error(`user ${id} not found`);
  }

  const profile = { ...snap.data()!, id };
  sessionStorage.setItem(`profile/${id}`, JSON.stringify(profile));
  return profile;
}

/**
 * @param ids the user ids to query for
 * @returns a map of user ids to their profile data
 */
export function useProfiles(ids: string[] | undefined) {
  const [profiles, setProfiles] = useState<Record<string, WithId<UserProfile>>>();

  useEffect(() => {
    if (!ids) return;

    Promise.allSettled(ids.map(getProfile))
      .then((settled) => {
        // filter out any failed requests and log them
        const results = settled.map((result) => {
          if (result.status === 'fulfilled') return result.value;
          console.error('failed getting profile:', result.reason);
          return null;
        });
        const users = allTruthy(results);
        setProfiles(Object.fromEntries(users.map((user) => [user.id, user])));
      })
      .catch((err) => console.error('[useProfiles] error getting profiles:', err));
  }, [ids]);

  return profiles;
}


export function useFriendRequests(uid: string | null | undefined) {
  const [incoming, setIncoming] = useState<(WithId<FriendRequest>)[]>([]);
  const [outgoing, setOutgoing] = useState<(WithId<FriendRequest>)[]>([]);

  useEffect(() => {
    if (!uid) return;

    const incomingQ = query(Firestore.Collection.allFriends(), where('to', '==', uid));
    const outgoingQ = query(Firestore.Collection.allFriends(), where('from', '==', uid));

    const unsubIn = onSnapshot(incomingQ, (snap) => setIncoming(snap.docs.map((d) => ({ ...d.data(), id: d.id }))));
    const unsubOut = onSnapshot(outgoingQ, (snap) => setOutgoing(snap.docs.map((d) => ({ ...d.data(), id: d.id }))));

    return () => {
      unsubIn();
      unsubOut();
    };
  }, [uid]);

  return { incoming, outgoing };
}


/**
 * Gets the friends of a user.
 * @param userId the user id to get friends for
 * @returns the friends, incoming pending requests, and outgoing pending requests
 */
export function useFriends(userId: string) {
  const { incoming, outgoing } = useFriendRequests(userId);

  const userIds = useMemo(() => {
    const ids: string[] = [];
    new Set([...incoming, ...outgoing].flatMap((req) => [req.from, req.to])).forEach((id) => ids.push(id));
    return ids;
  }, [incoming, outgoing]);

  const profiles = useProfiles(userIds);

  const friends = profiles && allTruthy([
    ...incoming.map((req) => (req.accepted ? profiles[req.from] : null)),
    ...outgoing.map((req) => (req.accepted ? profiles[req.to] : null)),
  ]);

  const incomingPending = profiles && allTruthy(incoming.map((req) => (req.accepted ? null : profiles[req.from])));

  return { friends, incomingPending };
}

export function handleError(err: unknown) {
  alert('An unexpected error occurred! Please try again later.');
  console.error(err);
}


export function useAppDispatch() { return useDispatch<AppDispatch>(); }
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
