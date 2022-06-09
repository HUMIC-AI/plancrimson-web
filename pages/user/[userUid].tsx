import {
  onSnapshot, where,
} from 'firebase/firestore';
import { useRouter } from 'next/router';
import { useEffect, useMemo, useState } from 'react';
import Layout from '../../components/Layout/Layout';
import { selectSchedules } from '../../src/features/schedules';
import { selectUserUid } from '../../src/features/userData';
import {
  getFriendRequestRef, sendFriendRequest, unfriend, useAppSelector,
} from '../../src/hooks';

type FriendStatus = 'loading' | 'none' | 'friends' | 'pending';

const statusMessage: Record<FriendStatus, string> = {
  loading: 'Loading...',
  none: 'Add friend',
  friends: 'Friends',
  pending: 'Cancel request',
};

export default function UserPage() {
  const router = useRouter();
  const userUid = router.query.userUid as string;
  const uid = useAppSelector(selectUserUid);
  const schedules = useAppSelector(selectSchedules);
  const [friendStatus, setFriendStatus] = useState<FriendStatus>('loading');

  useEffect(() => {
    if (!uid) return;
    const ref = getFriendRequestRef(uid, userUid);
    const unsub = onSnapshot(
      ref,
      (snap) => {
        const data = snap.data();
        if (!data) setFriendStatus('none');
        else if (data.accepted) setFriendStatus('friends');
        else setFriendStatus('pending');
      },
      (err) => {
        console.error('error fetching friend request document', ref.path, err);
      },
    );
    return unsub;
  }, [uid]);

  const queryConstraints = useMemo(() => (uid ? [where('public', '==', true)] : []), [uid]);

  return (
    <Layout scheduleQueryConstraints={queryConstraints}>
      <div className="flex justify-between items-center">
        <div className="rounded-full bg-blue-300 h-16 w-16" />
        {uid && (
        <div>
          <h1 className="text-3xl">{userUid}</h1>
          <button
            type="button"
            onClick={() => {
              if (friendStatus === 'friends' || friendStatus === 'pending') {
                unfriend(uid, userUid);
              } else if (friendStatus === 'none') {
                sendFriendRequest(uid, userUid);
              }
            }}
          >
            {statusMessage[friendStatus]}
          </button>
        </div>
        )}
      </div>
      <ul>
        {Object.values(schedules).map((schedule) => <li key={schedule.id}>{schedule.title}</li>)}
      </ul>
    </Layout>
  );
}
