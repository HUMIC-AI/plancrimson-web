import axios, { AxiosRequestConfig } from 'axios';
import { useState } from 'react';
import useSWR from 'swr';
import { SearchParams, SearchResults } from './types';

export class FetchError extends Error {
  constructor(message: string, public status: number, public info?: any) {
    super(message);
    this.name = 'FetchError';
  }
}

export const fetcher = async (config: AxiosRequestConfig) => {
  try {
    const { data } = await axios(config);
    return data;
  } catch (err: any) {
    if (err.response) {
      throw new FetchError(err.message, err.response.status, err.response.data);
    } else if (err.request) {
      throw new FetchError(err.message, -1, err.request);
    } else {
      throw new FetchError(err.message, -2, err.config);
    }
  }
};

/**
 * a hook to enable searching for classes on my.harvard.
 * will send a new request whenever searchParams changes
 */
export function useSearch() {
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
