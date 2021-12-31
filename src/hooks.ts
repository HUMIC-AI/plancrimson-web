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

/**
 * a hook to enable searching for classes on my.harvard.
 * will send a new request whenever searchParams changes
 */
export default function useSearch() {
  const [searchParams, search] = useState<SearchParams>({});
  const { data, error } = useSWR<SearchResults, FetchError, AxiosRequestConfig>(typeof searchParams.search === 'undefined'
    ? null as unknown as AxiosRequestConfig
    : {
      url: '/api/search',
      method: 'POST',
      data: searchParams,
    }, fetcher);

  return {
    searchResults: data,
    searchParams,
    search,
    error,
    loading: searchParams.search && !data && !error,
  };
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
