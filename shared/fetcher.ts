import axios, { AxiosRequestConfig } from 'axios';

export class FetchError extends Error {
  constructor(message: string, public status: number, public info: any) {
    super(message);
    this.name = 'FetchError';
  }
}

export default async function fetcher<Data = any>(config: AxiosRequestConfig<Data>) {
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
}
