import { updateDoc, deleteDoc } from 'firebase/firestore';
import { Auth } from '@/src/features';
import { useElapsed } from '@/src/utils/hooks';
import Firestore from '@/src/schema';
import { UserProfile, WithId } from '@/src/types';
import { getAnalytics, logEvent } from 'firebase/analytics';
import ProfileList from './ProfileList';
import { useFriends } from './friendUtils';

export default function () {
  const userId = Auth.useAuthProperty('uid');

  if (!userId) return <p>Loading...</p>;

  return <IncomingRequests userId={userId} />;
}

export function IncomingRequests({ userId }: { userId: string }) {
  const elapsed = useElapsed(500, []);
  const { incomingPending: pending } = useFriends(userId);

  if (typeof pending === 'undefined') {
    if (elapsed) return <p>Loading...</p>;
    return null;
  }

  if (pending.length === 0) {
    return null;
  }

  return (
    <ProfileList
      profiles={pending}
      Button={IncomingRequestButtons}
    />
  );
}

export function IncomingRequestList({ incomingPending }: { incomingPending?: WithId<UserProfile>[] }) {
  // extra layer of wrapping to fix return type
  return (
    <>
      {incomingPending && incomingPending.length > 0 && (
      <>
        <h2>Incoming requests</h2>
        <ProfileList profiles={incomingPending} Button={IncomingRequestButtons} />
      </>
      )}
    </>
  );
}

export function IncomingRequestButtons({ profile }: { profile: WithId<UserProfile> }) {
  const userId = Auth.useAuthProperty('uid');

  const ref = Firestore.friendRequest(profile.id, userId!);

  return (
    <>
      <button
        type="button"
        onClick={() => {
          logEvent(getAnalytics(), 'connect_accept_request', { from: profile.id, to: userId });
          updateDoc(ref, { accepted: true })
            .catch((err) => console.error('error accepting request', err));
        }}
        className="button primary"
      >
        Accept
      </button>
      <button
        type="button"
        onClick={() => {
          logEvent(getAnalytics(), 'connect_reject_request', { from: profile.id, to: userId });
          deleteDoc(ref)
            .catch((err) => console.error('error rejecting request', err));
        }}
        className="button primary ml-2"
      >
        Reject
      </button>
    </>
  );
}

