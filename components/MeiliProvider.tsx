import { instantMeiliSearch, InstantMeiliSearchInstance } from '@meilisearch/instant-meilisearch';
import {
  useState, useEffect, PropsWithChildren, useMemo,
} from 'react';
import { getMeiliApiKey, getMeiliHost, MeiliContext } from '@/src/context/meili';
import { Auth } from '@/src/features';


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
        console.log('instantiated MeiliSearch client');
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
