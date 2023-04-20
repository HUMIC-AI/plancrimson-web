import { InstantMeiliSearchInstance } from '@meilisearch/instant-meilisearch';
import { getDoc } from 'firebase/firestore';
import {
  createContext, useContext,
} from 'react';
import Schema from './schema';

export type { InstantMeiliSearchInstance };

/**
 * @returns The hostname of the Meilisearch instance, without a trailing slash.
 */
export function getMeiliHost() {
  const host = process.env.NODE_ENV === 'production'
    ? process.env.NEXT_PUBLIC_MEILI_IP
    : (process.env.NEXT_PUBLIC_DEV_MEILI_IP || 'http://127.0.0.1:7700');

  if (!host) {
    throw new Error('must configure the MEILI_IP environment variable');
  }

  if (host.charAt(host.length - 1) === '/') return host.slice(0, -1);

  return host;
}

export async function getMeiliApiKey() {
  const metadata = await getDoc(Schema.metadata());
  const key = metadata.data()?.meiliApiKey;
  if (!key && process.env.NODE_ENV !== 'development') throw new Error('metadata not found');
  return key;
}

export const MeiliContext = createContext<{
  client: InstantMeiliSearchInstance | null;
  error: string | null;
}>({
  client: null,
  error: null,
});

export const useMeiliClient = () => useContext(MeiliContext);
