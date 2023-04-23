import {
  setDoc, deleteDoc, onSnapshot, query, where,
} from 'firebase/firestore';
import { allTruthy } from 'plancrimson-utils';
import { WithId, FriendRequest } from '@/src/types';
import { useProfiles } from '@/src/utils/hooks';
import { useState, useEffect, useMemo } from 'react';
import Firestore from '@/src/schema';

/**
 * Send a friend request from one user to another
 * @param from the uid of the user sending the friend request
 * @param to the uid of the user to send a friend request to
 */
export function sendFriendRequest(from: string, to: string) {
  return setDoc(Firestore.friendRequest(from, to), {
    from,
    to,
    accepted: false,
  });
}


export function unfriend(from: string, to: string) {
  return Promise.allSettled([
    deleteDoc(Firestore.friendRequest(from, to)),
    deleteDoc(Firestore.friendRequest(to, from)),
  ]);
}


export function useFriendRequests(uid: string | null | undefined) {
  const [incoming, setIncoming] = useState<(WithId<FriendRequest>)[]>([]);
  const [outgoing, setOutgoing] = useState<(WithId<FriendRequest>)[]>([]);

  useEffect(() => {
    if (!uid) return;

    const incomingQ = query(Firestore.Collection.allFriends(), where('to', '==', uid));
    const outgoingQ = query(Firestore.Collection.allFriends(), where('from', '==', uid));

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

  const userIds = useMemo(() => {
    const ids: string[] = [];
    new Set([...incoming, ...outgoing].flatMap((req) => [req.from, req.to])).forEach((id) => ids.push(id));
    return ids;
  }, [incoming, outgoing]);

  const profiles = useProfiles(userIds);

  const friends = profiles && allTruthy([
    ...incoming.map((req) => (req.accepted ? profiles[req.from] : null)),
    ...outgoing.map((req) => (req.accepted ? profiles[req.to] : null)),
  ]);

  const incomingPending = profiles && allTruthy(incoming.map((req) => (req.accepted ? null : profiles[req.from])));

  return { friends, incomingPending };
}
