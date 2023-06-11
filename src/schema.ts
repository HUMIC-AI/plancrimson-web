import {
  getFirestore, doc, DocumentReference, collection, CollectionReference, collectionGroup, Query, query, where, DocumentSnapshot, QueryConstraint, limit, startAfter, getDocs,
} from 'firebase/firestore';
import type {
  UserProfile, UserSettings, FriendRequest, Metadata, Alert, FirestoreSchedule,
} from './types';
import { Season } from './lib';

export type QueryConfig = Partial<{
  publicOnly: boolean;
  user: string;
  ignoreUser: string;
  startAfter: DocumentSnapshot;
  pageSize: number;
  year: number;
  season: Season;
}>;

const db = getFirestore;

function getConstraints({
  publicOnly, user, ignoreUser, startAfter: snap, pageSize, year, season,
}: QueryConfig) {
  if (user && ignoreUser) {
    throw new Error('Cannot specify both user and ignoreUser');
  }

  const constraints: QueryConstraint[] = [];

  if (publicOnly) {
    constraints.push(where('public', '==', true));
  }

  if (user) {
    constraints.push(where('ownerUid', '==', user));
  }

  if (ignoreUser) {
    constraints.push(where('ownerUid', '!=', ignoreUser));
  }

  if (snap) {
    constraints.push(startAfter(snap));
  }

  if (pageSize) {
    constraints.push(limit(pageSize));
  }

  if (year) {
    constraints.push(where('year', '==', year));
  }

  if (season) {
    constraints.push(where('season', '==', season));
  }

  return constraints;
}

const Schema = {
  profile(uid: string) {
    return doc(db(), 'profiles', uid) as DocumentReference<UserProfile>;
  },
  user(uid: string) {
    return doc(db(), 'users', uid) as DocumentReference<UserSettings>;
  },
  schedule(scheduleUid: string) {
    return doc(db(), 'schedules', scheduleUid) as DocumentReference<FirestoreSchedule>;
  },
  friendRequest(from: string, to: string) {
    return doc(db(), 'allFriends', from, 'friends', to) as DocumentReference<FriendRequest>;
  },
  metadata() {
    return doc(db(), 'metadata', 'metadata') as DocumentReference<Metadata>;
  },
  Collection: {
    profiles() {
      return collection(db(), 'profiles') as CollectionReference<UserProfile>;
    },
    schedules() {
      return collection(db(), 'schedules') as CollectionReference<FirestoreSchedule>;
    },
    allFriends() {
      return collectionGroup(db(), 'friends') as Query<FriendRequest>;
    },
    alerts() {
      return collection(db(), 'alerts') as CollectionReference<Alert>;
    },
  },
} as const;

export default Schema;

export async function queryWithId<T>(c: CollectionReference<T>, config?: QueryConfig) {
  const q = config ? query(c, ...getConstraints(config)) : c;
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({
    ...d.data(),
    id: d.id,
  }));
}
