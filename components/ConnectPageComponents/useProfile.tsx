import {
  DocumentReference,
  getDoc,
  onSnapshot, query, where,
} from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { Auth } from '@/src/features';
import Schema from '@/src/schema';
import { FriendRequest, UserProfile, WithId } from '@/src/types';

export type FriendStatus = 'loading' | 'self' | 'none' | 'friends' | 'pending';

// get the profile of the user with the given username
export function useProfile(username: string) {
  const userId = Auth.useAuthProperty('uid');
  const [profile, setProfile] = useState<WithId<UserProfile> | null>(null);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!username || !userId) return;

    const unsubscribe = onSnapshot(
      query(Schema.Collection.profiles(), where('username', '==', username)),
      (snap) => {
        if (snap.empty) {
          setError(new Error('No users found with that username.'));
        } else if (snap.size > 1) {
          setError(new Error('Multiple users found with that username. This should not occur'));
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
  }, [username, userId]);

  return [profile, error] as const;
}
// this is a little jank but should be fine.
// check if user1 and user2 (ids) are friends.
export function useFriendStatus(user1: string | null | undefined, user2: string | null | undefined, refresh: boolean): FriendStatus {
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
