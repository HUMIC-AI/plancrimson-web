import { getDoc, deleteDoc } from 'firebase/firestore';
import Schema from 'shared/schema';
import {
  useElapsed, useFriends,
} from 'src/hooks';
import { Auth } from 'src/features';
import ProfileList from 'components/ConnectPageComponents/ProfileList';
import ConnectLayout from 'components/ConnectPageComponents/ConnectLayout';
import { UserProfile, WithId } from 'shared/types';
import FindClassmates from 'components/ConnectPageComponents/FindClassmates';

export default function FriendsPage() {
  const userId = Auth.useAuthProperty('uid');

  if (!userId) return <ConnectLayout title="Friends" />;

  return (
    <ConnectLayout title="Friends">
      <Wrapper userId={userId} />

      <h3 className="mt-4 mb-2 text-2xl font-medium">Recommended</h3>

      <FindClassmates />
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

function UnfriendButton({ profile }: { profile: WithId<UserProfile> }) {
  const userId = Auth.useAuthProperty('uid');

  /**
   * If the user has sent a friend request to the profile, delete the friend request.
   * Otherwise, delete the friend request that the profile sent to the user.
   */
  async function handleClick() {
    try {
      const outgoing = await getDoc(Schema.friendRequest(userId!, profile.id));
      if (outgoing.exists()) {
        await deleteDoc(outgoing.ref);
      } else {
        await deleteDoc(Schema.friendRequest(profile.id, userId!));
      }
    } catch (e) {
      console.error(e);
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className="interactive rounded bg-blue-900 px-2 py-1 text-white"
    >
      Unfriend
    </button>
  );
}

