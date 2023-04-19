import { instantMeiliSearch, InstantMeiliSearchInstance } from '@meilisearch/instant-meilisearch';
import { getDoc } from 'firebase/firestore';
import {
  useState, useEffect, PropsWithChildren, createContext, useContext, useMemo,
} from 'react';
import Schema from 'plancrimson-utils';
import { Auth } from './features';

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

const MeiliContext = createContext<{
  client: InstantMeiliSearchInstance | null;
  error: string | null;
}>({
  client: null,
  error: null,
});

export function MeiliProvider({ children }: PropsWithChildren<{}>) {
  const uid = Auth.useAuthProperty('uid');
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
        const newClient = instantMeiliSearch(getMeiliHost(), key, {
          keepZeroFacets: true,
        });
        setClient(newClient);
      })
      .catch((err) => {
        console.error('error fetching api key:', err);
        setError('error fetching MeiliSearch API key');
      });
  }, [uid]);

  const context = useMemo(() => ({
    client, error,
  }), [client, error]);

  return (
    <MeiliContext.Provider value={context}>
      {children}
    </MeiliContext.Provider>
  );
}

export const useMeiliClient = () => useContext(MeiliContext);
