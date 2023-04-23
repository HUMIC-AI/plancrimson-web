import { updateDoc, deleteDoc } from 'firebase/firestore';
import { Auth } from '@/src/features';
import { useElapsed } from '@/src/utils/hooks';
import Firestore from '@/src/schema';
import { UserProfile, WithId } from '@/src/types';
import ProfileList from './ProfileList';
import { useFriends } from './friendUtils';

export default function IncomingRequests() {
  const userId = Auth.useAuthProperty('uid');

  if (!userId) return <p>Loading...</p>;

  return <Wrapper userId={userId} />;
}

function Wrapper({ userId }: { userId: string }) {
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

function IncomingRequestButtons({ profile }: { profile: WithId<UserProfile> }) {
  const userId = Auth.useAuthProperty('uid');

  const ref = Firestore.friendRequest(profile.id, userId!);
  return (
    <>
      <button
        type="button"
        onClick={() => {
          updateDoc(ref, { accepted: true }).catch((err) => console.error('error accepting request', err));
        }}
        className="interactive rounded bg-primary-dark px-2 py-1 text-white"
      >
        Accept
      </button>
      <button
        type="button"
        onClick={() => {
          deleteDoc(ref).catch((err) => console.error('error rejecting request', err));
        }}
        className="interactive ml-2 rounded bg-primary-dark px-2 py-1 text-white"
      >
        Reject
      </button>
    </>
  );
}

