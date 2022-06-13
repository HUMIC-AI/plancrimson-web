import * as Firestore from 'firebase/firestore';
import type {
  UserProfile, UserSettings, Schedule, FriendRequest, Metadata, Alert,
} from './types';

const db = Firestore.getFirestore;

const Schema = {
  profile(uid: string) {
    return Firestore.doc(db(), 'profiles', uid) as Firestore.DocumentReference<UserProfile>;
  },
  user(uid: string) {
    return Firestore.doc(db(), 'users', uid) as Firestore.DocumentReference<UserSettings>;
  },
  schedule(scheduleUid: string) {
    return Firestore.doc(db(), 'schedules', scheduleUid) as Firestore.DocumentReference<Schedule>;
  },
  friendRequest(from: string, to: string) {
    return Firestore.doc(db(), 'allFriends', from, 'friends', to) as Firestore.DocumentReference<FriendRequest>;
  },
  metadata() {
    return Firestore.doc(db(), 'metadata', 'metadata') as Firestore.DocumentReference<Metadata>;
  },
  Collection: {
    profiles() {
      return Firestore.collection(db(), 'profiles') as Firestore.CollectionReference<UserProfile>;
    },
    schedules() {
      return Firestore.collection(db(), 'schedules') as Firestore.CollectionReference<Schedule>;
    },
    allFriends() {
      return Firestore.collectionGroup(db(), 'friends') as Firestore.Query<FriendRequest>;
    },
    alerts() {
      return Firestore.collection(db(), 'alerts') as Firestore.CollectionReference<Alert>;
    },
  },
};

export default Schema;
