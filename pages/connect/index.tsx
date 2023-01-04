import {
  limit, where,
} from 'firebase/firestore';
import { useMemo } from 'react';
import Layout, { errorMessages, ErrorPage, LoadingPage } from 'components/Layout/Layout';
import { Auth } from 'src/features';
import { useElapsed } from 'src/hooks';
import ConnectLayout from 'components/ConnectPageComponents/ConnectLayout';
import PublicSchedules from 'components/ConnectPageComponents/PublicSchedules';
import FriendRequests from 'components/ConnectPageComponents/FriendRequests';

/**
 * TODO add search bar for public schedules
 */
export default function ConnectPage() {
  const userId = Auth.useAuthProperty('uid');
  const constraints = useMemo(() => [
    where('public', '==', true),
    where('owner', '!=', userId),
    limit(20),
  ], []);

  const elapsed = useElapsed(2000, []);

  if (userId === null) {
    return <ErrorPage>{errorMessages.unauthorized}</ErrorPage>;
  }

  if (typeof userId === 'undefined') {
    if (elapsed) return <LoadingPage />;
    return <Layout />;
  }

  return (
    <ConnectLayout
      title="Connect"
      scheduleQueryConstraints={constraints}
    >
      <FriendRequests />
      <PublicSchedules />
    </ConnectLayout>
  );
}
