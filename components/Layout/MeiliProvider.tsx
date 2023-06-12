import { instantMeiliSearch, type InstantMeiliSearchInstance } from '@meilisearch/instant-meilisearch';
import {
  useState, useEffect, type PropsWithChildren, useMemo,
} from 'react';
import { getMeiliApiKey, getMeiliHost, MeiliContext } from '@/src/context/meili';

/**
 * Provides the React context for the MeiliSearch client.
 * To minimize bundle size, instead use the WithMeili component.
 */
export default function MeiliProvider({
  children, userId,
}: PropsWithChildren<{ userId: string }>) {
  const [client, setClient] = useState<InstantMeiliSearchInstance | null>(null);
  const [error, setError] = useState<string>();

  useEffect(() => {
    // reset the client if the user logs out or logs in
    setClient(null);

    setError(undefined);

    getMeiliApiKey()
      .then((key) => {
        const newClient = instantMeiliSearch(getMeiliHost(), key, {
          keepZeroFacets: true,
        });
        setClient(newClient);
        console.info('instantiated MeiliSearch client');
      })
      .catch((err) => {
        console.error('error fetching MeiliSearch api key:', err);
        setError(`Error fetching MeiliSearch API key: ${err.message}`);
      });
  }, [userId]);

  const context = useMemo(() => ({
    client, error,
  }), [client, error]);

  return (
    <MeiliContext.Provider value={context}>
      {children}
    </MeiliContext.Provider>
  );
}
