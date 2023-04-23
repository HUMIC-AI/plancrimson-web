import {
  limit, where,
} from 'firebase/firestore';
import { useMemo } from 'react';
import Layout, { errorMessages } from '@/components/Layout/Layout';
import { ErrorPage } from '@/components/Layout/ErrorPage';
import { LoadingBars } from '@/components/Layout/LoadingPage';
import { Auth } from '@/src/features';
import { useElapsed } from '@/src/utils/hooks';
import ConnectLayout from '@/components/ConnectPageComponents/ConnectLayout';
import PublicSchedules from '@/components/ConnectPageComponents/PublicSchedules';
import FriendRequests from '@/components/ConnectPageComponents/FriendRequests';
import useSyncSchedulesMatchingContraints from '@/src/utils/schedules';

/**
 * TODO add search bar for public schedules
 */
export default function ConnectPage() {
  const userId = Auth.useAuthProperty('uid');

  // get public schedules from other users
  const constraints = useMemo(() => [
    where('public', '==', true),
    where('owner', '!=', userId),
    limit(20),
  ], [userId]);
  useSyncSchedulesMatchingContraints(constraints);

  const elapsed = useElapsed(2000, []);

  if (userId === null) {
    return <ErrorPage>{errorMessages.unauthorized}</ErrorPage>;
  }

  if (typeof userId === 'undefined') {
    return (
      <Layout>
        {elapsed && <LoadingBars />}
      </Layout>
    );
  }

  return (
    <ConnectLayout title="Connect">
      <FriendRequests />
      <PublicSchedules />
    </ConnectLayout>
  );
}
