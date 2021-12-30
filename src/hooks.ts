import { AxiosRequestConfig } from 'axios';
import { useEffect, useState } from 'react';
import useSWR from 'swr';
import { getFirestore, DocumentReference, doc } from 'firebase/firestore';
import { Class, SearchParams, SearchResults } from '../shared/apiTypes';
import fetcher, { FetchError } from '../shared/fetcher';
import { fetchClass } from '../shared/util';
import { UserData } from '../shared/firestoreTypes';

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

export function useClassCache(classNumbers: Array<string>) {
  const [classCache, setClassCache] = useState<ClassCache>({});
  const [fetchClassError, setFetchClassError] = useState<any[] | undefined>();

  useEffect(() => {
    Promise.allSettled(classNumbers.map(async (number) => {
      if (classCache[number]) {
        return { [number]: classCache[number] };
      }
      return { [number]: await fetchClass(number) };
    }))
      .then((results) => {
        const fulfilled = results.filter((result) => result.status === 'fulfilled');
        setClassCache(Object.assign({}, ...fulfilled.map((result) => result.status === 'fulfilled' && result.value)));
        const rejected = results.filter((result) => result.status === 'rejected');
        setFetchClassError(rejected.map((result) => result.status === 'rejected' && result.reason));
      })
      .catch((err) => setFetchClassError(err));
  }, [classNumbers]);

  return { classCache, fetchClassError };
}
