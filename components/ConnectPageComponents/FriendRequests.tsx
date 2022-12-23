import { updateDoc, deleteDoc } from 'firebase/firestore';
import Schema from 'shared/schema';
import { UserProfileWithId } from 'shared/types';
import { Auth } from 'src/features';
import { useElapsed, useFriends } from 'src/hooks';
import ProfileList from './ProfileList';

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

function IncomingRequestButtons({ profile }: { profile: UserProfileWithId }) {
  const userId = Auth.useAuthProperty('uid');

  const ref = Schema.friendRequest(profile.id, userId!);
  return (
    <>
      <button
        type="button"
        onClick={() => {
          updateDoc(ref, { accepted: true }).catch((err) => console.error('error accepting request', err));
        }}
        className="interactive rounded bg-blue-900 px-2 py-1 text-white"
      >
        Accept
      </button>
      <button
        type="button"
        onClick={() => {
          deleteDoc(ref).catch((err) => console.error('error rejecting request', err));
        }}
        className="interactive ml-2 rounded bg-blue-900 px-2 py-1 text-white"
      >
        Reject
      </button>
    </>
  );
}

