import { AxiosRequestConfig } from 'axios';
import { useState } from 'react';
import useSWR from 'swr';
import fetcher, { FetchError } from '../shared/fetcher';
import { SearchParams, SearchResults } from './types';

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
