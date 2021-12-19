import axios, { AxiosError, AxiosRequestConfig } from 'axios';
import { useState } from 'react';
import useSWR from 'swr';
import { MyHarvardResponse } from './types';

export type SearchParams = {
  search?: string;
  pageNumber?: number;
  facets?: Array<string>;
};

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

export function useSearch() {
  const [searchParams, setSearchParams] = useState<SearchParams>({});
  const { data, error } = useSWR<MyHarvardResponse, FetchError, AxiosRequestConfig>(typeof searchParams.search === 'undefined'
    ? null as unknown as AxiosRequestConfig
    : {
      url: '/api/search',
      method: 'POST',
      data: searchParams,
    }, fetcher);

  return {
    searchParams, setSearchParams, searchResults: data, error, loading: searchParams.search && !data && !error,
  };
}
