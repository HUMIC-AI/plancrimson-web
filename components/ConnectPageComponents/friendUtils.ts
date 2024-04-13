import {
  setDoc, deleteDoc, onSnapshot, query, where,
} from 'firebase/firestore';
import { allTruthy } from '@/src/lib';
import { WithId, FriendRequest } from '@/src/types';
import { useProfiles } from '@/src/utils/hooks';
import { useState, useEffect, useMemo } from 'react';
import Schema from '@/src/schema';
import { getAnalytics, logEvent } from 'firebase/analytics';

/**
 * Send a friend request from one user to another
 * @param from the uid of the user sending the friend request
 * @param to the uid of the user to send a friend request to
 */
export function sendFriendRequest(from: string, to: string) {
  logEvent(getAnalytics(), 'connect_send_request', { from, to });
  return setDoc(Schema.friendRequest(from, to), {
    from,
    to,
    accepted: false,
  });
}


export function unfriend(from: string, to: string) {
  logEvent(getAnalytics(), 'connect_unfriend', { from, to });
  return Promise.allSettled([
    deleteDoc(Schema.friendRequest(from, to)),
    deleteDoc(Schema.friendRequest(to, from)),
  ]);
}


export function useFriendRequests(uid: string | null | undefined) {
  const [incoming, setIncoming] = useState<(WithId<FriendRequest>)[]>([]);
  const [outgoing, setOutgoing] = useState<(WithId<FriendRequest>)[]>([]);

  useEffect(() => {
    if (!uid) return;

    const incomingQ = query(Schema.Collection.allFriends(), where('to', '==', uid));
    const outgoingQ = query(Schema.Collection.allFriends(), where('from', '==', uid));

    const unsubIn = onSnapshot(incomingQ, (snap) => setIncoming(snap.docs.map((d) => ({ ...d.data(), id: d.id }))));
    const unsubOut = onSnapshot(outgoingQ, (snap) => setOutgoing(snap.docs.map((d) => ({ ...d.data(), id: d.id }))));

    return () => {
      unsubIn();
      unsubOut();
    };
  }, [uid]);

  return { incoming, outgoing };
}


/**
 * Gets the friends of a user.
 * @param userId the user id to get friends for
 * @returns the friends, incoming pending requests, and outgoing pending requests
 */
export function useFriends(userId: string) {
  const { incoming, outgoing } = useFriendRequests(userId);

  const allUserIdsInRequests = useMemo(() => {
    // get all unique ids
    const allIds = [...incoming, ...outgoing].flatMap((req) => [req.from, req.to]);
    const uniqueIds = new Set(allIds);
    // convert to list
    const ids: string[] = [];
    uniqueIds.forEach((id) => ids.push(id));
    return ids;
  }, [incoming, outgoing]);

  const profiles = useProfiles(allUserIdsInRequests);

  const friends = useMemo(() => profiles && allTruthy([
    ...incoming.map((req) => (req.accepted ? profiles[req.from] : null)),
    ...outgoing.map((req) => (req.accepted ? profiles[req.to] : null)),
  ]), [profiles, incoming, outgoing]);

  const incomingPending = useMemo(() => profiles && allTruthy(incoming.map(
    (req) => (req.accepted ? null : profiles[req.from]),
  )), [profiles, incoming]);

  return { friends, incomingPending };
}

export function useIds(users?: { id: string }[]) {
  return useMemo(() => users?.map((u) => u.id), [users]);
}
