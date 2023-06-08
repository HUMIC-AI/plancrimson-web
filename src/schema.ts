import {
  getFirestore, doc, DocumentReference, collection, CollectionReference, collectionGroup, Query,
} from 'firebase/firestore';
import type {
  UserProfile, UserSettings, FriendRequest, Metadata, Alert, FirestoreSchedule,
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
};

export default Schema;
