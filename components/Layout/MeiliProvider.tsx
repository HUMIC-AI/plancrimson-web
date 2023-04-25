import { instantMeiliSearch, type InstantMeiliSearchInstance } from '@meilisearch/instant-meilisearch';
import {
  useState, useEffect, type PropsWithChildren, useMemo,
} from 'react';
import { getMeiliApiKey, getMeiliHost, MeiliContext } from '@/src/context/meili';
import { Auth } from '@/src/features';


/**
 * Provides the React context for the MeiliSearch client.
 * Sets the client to be null if the user is not logged in.
 * To minimize bundle size, instead use the WithMeili component.
 */
export default function MeiliProvider({ children }: PropsWithChildren<{}>) {
  const uid = Auth.useAuthProperty('uid');
  const [client, setClient] = useState<InstantMeiliSearchInstance | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // reset the client if the user logs out or logs in
    setClient(null);

    if (!uid) {
      console.info('tried to instantiate MeiliSearch client without being signed in');
      setError('Not signed in');
      return;
    }

    setError(null);

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
