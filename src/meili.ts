import { instantMeiliSearch, InstantMeiliSearchInstance } from '@meilisearch/instant-meilisearch';
import { getDoc } from 'firebase/firestore';
import { useState, useEffect } from 'react';
import { Schema } from '../shared/firestoreTypes';

export type { InstantMeiliSearchInstance };

export function getMeiliHost() {
  const host = process.env.NODE_ENV === 'production'
    ? process.env.NEXT_PUBLIC_MEILI_IP
    : (process.env.NEXT_PUBLIC_DEV_MEILI_IP || 'http://127.0.0.1:7700');

  if (!host) {
    throw new Error('must configure the MEILI_IP environment variable');
  }

  return host;
}

export async function getMeiliApiKey() {
  const metadata = await getDoc(Schema.metadata());
  return metadata.data()?.meiliApiKey;
}

export function useMeiliClient(uid: string | null | undefined) {
  const [client, setClient] = useState<InstantMeiliSearchInstance | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!uid) {
      setError('not signed in');
      return;
    }

    setError(null);

    getMeiliApiKey()
      .then((key) => setClient(instantMeiliSearch(getMeiliHost(), key, {
        paginationTotalHits: 200,
      })))
      .catch(() => setError('error fetching MeiliSearch API key'));
  }, [uid]);

  return { client, error };
}
