import { AxiosRequestConfig } from 'axios';
import { useEffect, useState } from 'react';
import useSWR from 'swr';
import { getFirestore, DocumentReference, doc } from 'firebase/firestore';
import { Class, SearchParams, SearchResults } from '../shared/apiTypes';
import fetcher, { FetchError } from '../shared/fetcher';
import { UserData } from '../shared/firestoreTypes';
import ClassIndex from '../shared/meilisearch';
import { allTruthy } from '../shared/util';

export function getUserRef(uid: string) {
  return doc(getFirestore(), 'users', uid) as DocumentReference<UserData>;
}

export type ClassCache = Record<string, Class>;

export function useClassCache(classIds: Array<string>) {
  const [classCache, setClassCache] = useState<ClassCache>({});
  const [fetchClassError, setFetchClassError] = useState<any[] | undefined>();

  useEffect(() => {
    Promise.allSettled(classIds.map(async (id) => {
      if (classCache[id]) {
        return { [id]: classCache[id] };
      }
      return { [id]: await ClassIndex.getDocument(id) };
    }))
      .then((results) => {
        const fulfilled = allTruthy(results.map((result) => (result.status === 'fulfilled' ? result.value : null)));
        setClassCache(Object.assign({}, ...fulfilled));
        const rejected = allTruthy(results.map((result) => (result.status === 'rejected' ? result.reason : null)));
        setFetchClassError(rejected);
      })
      .catch((err) => setFetchClassError(err));
  // we only want to update the cache if new classes are added
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [classIds]);

  return { classCache, fetchClassError };
}
