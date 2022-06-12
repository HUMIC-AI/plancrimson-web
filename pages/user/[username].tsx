import {
  DocumentReference,
  getDoc,
  getDocs,
  onSnapshot, query, where,
} from 'firebase/firestore';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useEffect, useMemo, useState } from 'react';
import useSWR from 'swr';
import Layout, { errorMessages, ErrorPage, LoadingPage } from '../../components/Layout/Layout';
import { FriendRequest, Schema } from '../../shared/firestoreTypes';
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
async function fetchProfile(username: string) {
  const snap = await getDocs(query(Schema.Collection.profiles(), where('username', '==', username)));
  if (snap.empty) {
    throw new Error('No users found with that username.');
  } else if (snap.size > 1) {
    throw new Error('Multiple users found with that username. This should not occur');
  } else {
    const [doc] = snap.docs;
    return { ...doc.data(), userId: doc.id };
  }
}

// this is a little jank but should be fine.
// check if user1 and user2 (ids) are friends.
function useFriendStatus(user1?: string | null, user2?: string | null): FriendStatus {
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
  }, [user1, user2]);

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

  const { data: pageProfile, error } = useSWR(username, fetchProfile);
  const friendStatus = useFriendStatus(uid, pageProfile?.userId);

  const queryConstraints = useMemo(() => {
    if (!uid || !pageProfile) return [];

    if (friendStatus === 'friends' || friendStatus === 'self') {
      return [where('ownerUid', '==', pageProfile.userId)];
    }

    return [where('ownerUid', '==', pageProfile.userId), where('public', '==', true)];
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
    <Layout scheduleQueryConstraints={queryConstraints} className="flex-1 mx-auto mt-8 w-full max-w-screen-md">
      <div className="flex flex-col space-y-8 border-2 border-blue-900 rounded-xl shadow p-8">
        <div className="flex items-center">
          {pageProfile.photoUrl
            ? <Image className="h-16 w-16 rounded-full" src={pageProfile.photoUrl} />
            : <div className="h-16 w-16 rounded-full bg-blue-300" />}

          <div className="ml-8">
            <h1 className="text-3xl">{pageProfile.username}</h1>

            {friendStatus !== 'self' && (
            <button
              type="button"
              onClick={() => {
                if (friendStatus === 'friends' || friendStatus === 'pending') {
                  unfriend(uid, pageProfile.userId);
                } else if (friendStatus === 'none') {
                  sendFriendRequest(uid, pageProfile.userId);
                }
              }}
              className="px-2 py-1 mt-2 rounded interactive bg-blue-900 text-white"
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
                  <Link href={`/schedule/${schedule.id}`}>
                    <a>
                      {schedule.title}
                    </a>
                  </Link>
                </li>
              ))}
            </ul>
          ) : <p>No schedules yet</p>}
        </section>
      </div>
    </Layout>
  );
}
