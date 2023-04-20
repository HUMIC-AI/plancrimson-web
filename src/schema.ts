import {
  getFirestore, doc, DocumentReference, collection, CollectionReference, collectionGroup, Query,
} from 'firebase/firestore';
import type {
  UserProfile, UserSettings, Schedule, FriendRequest, Metadata, Alert,
} from './types';

const db = getFirestore;

const Schema = {
  profile(uid: string) {
    return doc(db(), 'profiles', uid) as DocumentReference<UserProfile>;
  },
  user(uid: string) {
    return doc(db(), 'users', uid) as DocumentReference<UserSettings>;
  },
  schedule(scheduleUid: string) {
    return doc(db(), 'schedules', scheduleUid) as DocumentReference<Schedule>;
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
      return collection(db(), 'schedules') as CollectionReference<Schedule>;
    },
    allFriends() {
      return collectionGroup(db(), 'friends') as Query<FriendRequest>;
    },
    alerts() {
      return collection(db(), 'alerts') as CollectionReference<Alert>;
    },
  },
};

export default Schema;
