import {
  limit, where,
} from 'firebase/firestore';
import { useMemo } from 'react';
import Layout, { errorMessages } from '@/components/Layout/Layout';
import { ErrorPage } from '@/components/Layout/ErrorPage';
import { LoadingBars } from '@/components/Layout/LoadingPage';
import { Auth } from '@/src/features';
import { useElapsed } from '@/src/utils/hooks';
import PublicSchedules from '@/components/ConnectPageComponents/PublicSchedules';
import useSyncSchedulesMatchingContraints from '@/src/utils/schedules';

/**
 * TODO add search bar for public schedules
 */
export default function ConnectPage() {
  const userId = Auth.useAuthProperty('uid');

  // get public schedules from other users
  const constraints = useMemo(() => (userId ? [
    where('ownerUid', '!=', userId),
    limit(20),
  ] : null), [userId]);

  useSyncSchedulesMatchingContraints(constraints);

  const elapsed = useElapsed(2000, []);

  if (userId === null) {
    return (
      <ErrorPage>
        {errorMessages.unauthorized}
      </ErrorPage>
    );
  }

  if (typeof userId === 'undefined') {
    return (
      <Layout>
        {elapsed && <LoadingBars />}
      </Layout>
    );
  }

  return (
    <Layout title="Connect">
      <div className="mx-auto max-w-4xl">
        <PublicSchedules />
      </div>
    </Layout>
  );
}
