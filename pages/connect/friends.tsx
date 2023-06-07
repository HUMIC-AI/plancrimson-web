import { getDoc, deleteDoc } from 'firebase/firestore';
import { useState } from 'react';
import { useRouter } from 'next/router';
import { useElapsed } from '@/src/utils/hooks';
import { Auth } from '@/src/features';
import ProfileList from '@/components/ConnectPageComponents/ProfileList';
import ConnectLayout from '@/components/ConnectPageComponents/ConnectLayout';
import FindClassmates from '@/components/ConnectPageComponents/FindClassmates';
import Firestore from '@/src/schema';
import { UserProfile, WithId } from '@/src/types';
import { useFriends } from '@/components/ConnectPageComponents/friendUtils';

export default function FriendsPage() {
  const userId = Auth.useAuthProperty('uid');
  const router = useRouter();
  const [username, setUsername] = useState<string>();

  if (!userId) return <ConnectLayout title="Friends" />;

  return (
    <ConnectLayout title="Friends">
      <Wrapper userId={userId} />

      <p className="my-2 text-sm">To search for a user, type the first part of their college email.</p>

      <form onSubmit={(e) => {
        e.preventDefault();
        if (username) {
          router.push(`/user/${username}`);
        }
      }}
      >
        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.currentTarget.value)}
          className="rounded border border-gray-light px-2 py-1"
        />
        @college.harvard.edu

        <button
          type="submit"
          className="ml-2 rounded bg-blue-dark px-2 py-1 text-white"
        >
          Search
        </button>
      </form>

      <h3 className="mb-2 mt-4 text-2xl font-medium">Recommended</h3>

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
      const outgoing = await getDoc(Firestore.friendRequest(userId!, profile.id));
      if (outgoing.exists()) {
        await deleteDoc(outgoing.ref);
      } else {
        await deleteDoc(Firestore.friendRequest(profile.id, userId!));
      }
    } catch (e) {
      console.error(e);
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className="interactive rounded bg-blue-dark px-2 py-1 text-white"
    >
      Unfriend
    </button>
  );
}

