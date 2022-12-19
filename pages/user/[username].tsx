import {
  DocumentReference,
  getDoc,
  onSnapshot, query, where,
} from 'firebase/firestore';
import { useRouter } from 'next/router';
import { useEffect, useMemo, useState } from 'react';
import Layout, { errorMessages, ErrorPage, LoadingPage } from '../../components/Layout/Layout';
import { ImageWrapper, ScheduleSection } from '../../components/UserLink';
import { FriendRequest, UserProfileWithId } from '../../shared/types';
import Schema from '../../shared/schema';
import { Auth, Schedules } from '../../src/features';
import {
  sendFriendRequest, unfriend, useAppSelector, useElapsed,
} from '../../src/hooks';

type FriendStatus = 'loading' | 'self' | 'none' | 'friends' | 'pending';

const statusMessage: Record<FriendStatus, string> = {
  loading: 'Loading...',
  self: '',
  none: 'Add friend',
  friends: 'Friends',
  pending: 'Cancel request',
};

// get the profile of the user with the given username
function useProfile(username: string) {
  const [profile, setProfile] = useState<UserProfileWithId | null>(null);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!username) return;
    const unsubscribe = onSnapshot(
      query(Schema.Collection.profiles(), where('username', '==', username)),
      (snap) => {
        if (snap.empty) {
          throw new Error('No users found with that username.');
        } else if (snap.size > 1) {
          throw new Error('Multiple users found with that username. This should not occur');
        } else {
          const [doc] = snap.docs;
          setProfile({ ...doc.data(), id: doc.id });
        }
      },
      (err) => {
        setError(err);
      },
    );
    return () => unsubscribe();
  }, [username]);

  return [profile, error] as const;
}

// this is a little jank but should be fine.
// check if user1 and user2 (ids) are friends.
function useFriendStatus(user1: string | null | undefined, user2: string | null | undefined, refresh: boolean): FriendStatus {
  const [status, setStatus] = useState<FriendStatus>('loading');
  const [ref, setRef] = useState<DocumentReference<FriendRequest> | null>();

  // at most one of the two below will exist
  useEffect(() => {
    if (!user1 || !user2) return;
    if (user1 === user2) setStatus('self');
    else {
      (async () => {
        let snap = await getDoc(Schema.friendRequest(user1, user2));
        if (snap.exists()) {
          setRef(snap.ref);
          return;
        }
        snap = await getDoc(Schema.friendRequest(user2, user1));
        if (snap.exists()) {
          setRef(snap.ref);
        } else {
          setStatus('none');
        }
      })();
    }
  }, [user1, user2, refresh]);

  // once an existing friend request is found, we listen to it
  useEffect(() => {
    if (!ref) return;

    const unsub = onSnapshot(
      ref,
      (snap) => {
        const data = snap.data();
        if (!data) setStatus('none');
        else if (data.accepted) setStatus('friends');
        else setStatus('pending');
      },
      (err) => {
        console.error('error fetching friend request document', ref.path, err);
      },
    );

    return unsub;
  }, [ref]);

  return status;
}

export default function UserPage() {
  const router = useRouter();
  const username = router.query.username as string;
  const uid = Auth.useAuthProperty('uid');
  const scheduleMap = useAppSelector(Schedules.selectSchedules);
  const elapsed = useElapsed(5000, [username]);
  const [refresh, setRefresh] = useState(true);

  const [pageProfile, error] = useProfile(username);
  const friendStatus = useFriendStatus(uid, pageProfile?.id, refresh);

  const queryConstraints = useMemo(() => {
    if (!uid || !pageProfile) return [];

    if (friendStatus === 'friends' || friendStatus === 'self') {
      return [where('ownerUid', '==', pageProfile.id)];
    }

    return [where('ownerUid', '==', pageProfile.id), where('public', '==', true)];
  }, [uid]);

  if (uid === null) {
    return <ErrorPage>{errorMessages.unauthorized}</ErrorPage>;
  }

  if (typeof uid === 'undefined') {
    if (elapsed) return <LoadingPage />;
    return <Layout />;
  }

  if (error) {
    return <ErrorPage>{error.message}</ErrorPage>;
  }

  if (!pageProfile) {
    return <LoadingPage />;
  }

  const schedules = Object.values(scheduleMap);

  return (
    <Layout scheduleQueryConstraints={queryConstraints} className="mx-auto w-full max-w-screen-md flex-1 p-8">
      <div className="flex flex-col space-y-8 rounded-xl border-2 border-blue-900 p-8 shadow">
        <div className="flex items-center">
          <ImageWrapper url={pageProfile.photoUrl} size="md" alt="User profile" />

          <div className="ml-8">
            <h1 className="text-3xl">{pageProfile.username}</h1>

            {friendStatus !== 'self' && (
            <button
              type="button"
              onClick={() => {
                if (friendStatus === 'friends' || friendStatus === 'pending') {
                  unfriend(uid, pageProfile.id);
                  setRefresh(!refresh);
                } else if (friendStatus === 'none') {
                  sendFriendRequest(uid, pageProfile.id);
                  setRefresh(!refresh);
                }
              }}
              className="interactive mt-2 rounded bg-blue-900 px-2 py-1 text-white"
            >
              {statusMessage[friendStatus]}
            </button>
            )}
          </div>
        </div>

        <section className="space-y-2">
          <h2 className="text-xl">Schedules</h2>

          {schedules.length > 0 ? (
            <ul>
              {schedules.map((schedule) => (
                <li key={schedule.id}>
                  <ScheduleSection schedule={schedule} />
                </li>
              ))}
            </ul>
          ) : <p>No schedules yet</p>}
        </section>
      </div>
    </Layout>
  );
}
