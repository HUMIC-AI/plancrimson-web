import {
  DependencyList, useEffect, useState,
} from 'react';
import {
  getDoc, getDocFromCache,
} from 'firebase/firestore';
import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux';
import { allTruthy } from '@/src/lib';
import type { AppDispatch, RootState } from '../store';
import Firestore from '../schema';
import { UserProfile, WithId } from '../types';


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

function getProfileFromCacheThenServer(uid: string) {
  const profileRef = Firestore.profile(uid);
  return getDocFromCache(profileRef)
    .catch(() => getDoc(profileRef));
}

/**
 * @param ids the user ids to query for
 * @returns a map of user ids to their profile data
 */
export function useProfiles(ids: string[] | undefined) {
  const [profiles, setProfiles] = useState<Record<string, WithId<UserProfile>>>();

  useEffect(() => {
    if (!ids) return;

    const promises = ids.map(getProfileFromCacheThenServer);

    Promise.allSettled(promises)
      .then((settled) => {
        // filter out any failed requests and log them
        const results = settled.map((result) => {
          if (result.status === 'fulfilled') return result.value;
          console.error('failed getting profile:', result.reason);
          return null;
        });
        const users = allTruthy(results);
        setProfiles(Object.fromEntries(users.map((user) => [
          user.id, { id: user.id, ...user.data()! },
        ] as const)));
      });
  }, [ids]);

  return profiles;
}

export function alertUnexpectedError(err: unknown) {
  alert('An unexpected error occurred! Please try again later.');
  console.error(err);
}

export function useAppDispatch() { return useDispatch<AppDispatch>(); }

export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
