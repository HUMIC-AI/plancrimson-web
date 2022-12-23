import { getDoc, deleteDoc } from 'firebase/firestore';
import Schema from 'shared/schema';
import { UserProfileWithId } from 'shared/types';
import {
  useElapsed, useFriends,
} from 'src/hooks';
import { Auth } from 'src/features';
import ProfileList from 'components/ConnectPageComponents/ProfileList';
import ConnectLayout from 'components/ConnectPageComponents/ConnectLayout';

export default function FriendsPage() {
  const userId = Auth.useAuthProperty('uid');
  if (!userId) return <ConnectLayout />;
  return (
    <ConnectLayout>
      <Wrapper userId={userId} />
    </ConnectLayout>
  );
}

function Wrapper({ userId }: { userId: string }) {
  const elapsed = useElapsed(500, []);
  const { friends } = useFriends(userId);

  if (typeof friends === 'undefined') {
    if (elapsed) return <p>Loading...</p>;
    return null;
  }

  if (friends.length === 0) {
    return <p>You haven&rsquo;t added any friends yet.</p>;
  }

  return (
    <ProfileList
      profiles={friends}
      Button={UnfriendButton}
    />
  );
}

function UnfriendButton({ profile }: { profile: UserProfileWithId }) {
  const userId = Auth.useAuthProperty('uid');

  return (
    <button
      type="button"
      onClick={async () => {
        const outgoing = await getDoc(Schema.friendRequest(userId!, profile.id));
        if (outgoing.exists()) {
          await deleteDoc(outgoing.ref);
        } else {
          await deleteDoc(Schema.friendRequest(profile.id, userId!));
        }
      }}
      className="interactive rounded bg-blue-900 px-2 py-1 text-white"
    >
      Unfriend
    </button>
  );
}

