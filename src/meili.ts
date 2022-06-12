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

async function getMeiliApiKey() {
  const metadata = await getDoc(Schema.metadata());
  const key = metadata.data()?.meiliApiKey;
  if (!key && process.env.NODE_ENV !== 'development') throw new Error('metadata not found');
  return key;
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
      .then((key) => {
        setClient(instantMeiliSearch(getMeiliHost(), key, {
          paginationTotalHits: 500,
        }));
      })
      .catch((err) => {
        console.error('error fetching api key:', err);
        setError('error fetching MeiliSearch API key');
      });
  }, [uid]);

  return { client, error };
}
