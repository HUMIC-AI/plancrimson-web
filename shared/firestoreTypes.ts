import * as Firestore from 'firebase/firestore';
import { Concentration } from './assets/concentrations';

export const Schema = {
  profile(uid: string) {
    return Firestore.doc(Firestore.getFirestore(), 'profiles', uid) as Firestore.DocumentReference<UserProfile>;
  },
  user(uid: string) {
    return Firestore.doc(Firestore.getFirestore(), 'users', uid) as Firestore.DocumentReference<UserSettings>;
  },
  schedule(scheduleUid: string) {
    return Firestore.doc(Firestore.getFirestore(), 'schedules', scheduleUid) as Firestore.DocumentReference<Schedule>;
  },
  friendRequest(from: string, to: string) {
    return Firestore.doc(Firestore.getFirestore(), 'allFriends', from, 'friends', to) as Firestore.DocumentReference<FriendRequest>;
  },
  metadata() {
    return Firestore.doc(Firestore.getFirestore(), 'metadata', 'metadata') as Firestore.DocumentReference<Metadata>;
  },
  Collection: {
    profiles() {
      return Firestore.collection(Firestore.getFirestore(), 'profiles') as Firestore.CollectionReference<UserProfile>;
    },
    schedules() {
      return Firestore.collection(Firestore.getFirestore(), 'schedules') as Firestore.CollectionReference<Schedule>;
    },
    allFriends() {
      return Firestore.collectionGroup(Firestore.getFirestore(), 'friends') as Firestore.Query<FriendRequest>;
    },
  },
};

export const SEASON_ORDER = {
  Winter: 0,
  Spring: 1,
  Summer: 2,
  Fall: 3,
} as const;

export type Season = keyof typeof SEASON_ORDER;

export type Semester = { year: number; season: Season };

export type ClassId = string;

// also used for sorting
export const DAYS_OF_WEEK = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
] as const;

export const DAY_SHORT = ['MON', 'TUES', 'WED', 'THURS', 'FRI', 'SAT'] as const;

export interface Metadata {
  whiteList: string[];
  meiliApiKey: string;
}

// ============================== /userProfiles ==============================

// public data
export interface UserProfile {
  username: string | null; // eg alexcai
  displayName: string | null; // eg Alexander Cai
  bio: string | null;
  photoUrl: string | null;
  classYear: number | null;
  concentrationRanking: Concentration[] | null;
}

export interface UserProfileWithId extends UserProfile {
  id: string;
}

// ============================== /users ==============================

// Contains a user's selected schedules, custom class times, and waived reqs.
export interface UserSettings {
  chosenSchedules: {
    [semester: Term]: string | null;
  };

  customTimes: {
    [classId: string]: CustomTimeRecord;
  };

  // for each requirement,
  // if waivedRequirements[requirement.id].waived is set to true,
  // we just take the user's word for it and don't do any checking
  // if waived is set to false,
  // then we include the classes given when passing through the reducer
  waivedRequirements: {
    [requirementId: string]: {
      waived: boolean;
      classes: string[];
    };
  };
}

export function getInitialSettings(): UserSettings {
  return {
    chosenSchedules: {},
    customTimes: {},
    waivedRequirements: {},
  };
}

export interface CustomTimeRecord {
  pattern: DayOfWeek[],
  start: number; // decimal hour
  end: number; // decimal hour
  startDate: string; // yyyy-mm-dd
  endDate: string; // yyyy-mm-dd
}

export type DayOfWeek = typeof DAYS_OF_WEEK[number];

export type Term = `${number}${Season}`;

// ============================== /schedules ==============================

/**
 * The Firestore schema for the /schedules collection.
 */
export interface Schedule extends Semester {
  id: string; // global unique id
  title: string;
  ownerUid: string; // uid of the user that created this schedule
  public: boolean;
  classes: UserClassData[];
}

// an entry in a schedule
export interface UserClassData {
  classId: string;
  grade?: Grade;
}

// see https://infoforfaculty.fas.harvard.edu/book/grading-system
export const PASSING_GRADES = [
  'A',
  'A-',
  'B+',
  'B',
  'B-',
  'C+',
  'C',
  'C-',
  'D+',
  'D',
  'D-',
  'PA', // A to D-
  'SAT', // A to C-
] as const;

export const FAILING_GRADES = [
  'E',
  'ABS',
  'EXL',
  'EXT',
  'FL',
  'UNSAT',
] as const;

export type Grade = typeof PASSING_GRADES[number] | typeof FAILING_GRADES[number];

// ============================== /allFriends/{from}/friends ==============================

// schema for the /allFriends/{from}/friends/{to} documents
export interface FriendRequest {
  from: string; // uid
  to: string; // uid
  accepted: boolean;
}

// ============================== misc ==============================

export type Viability = 'Yes' | 'Likely' | 'Unlikely' | 'No';

export interface DownloadPlan {
  id: string;
  schedules: Schedule[];
}

// maps from ids to schedules
export interface ScheduleMap {
  [scheduleId: string]: Schedule;
}
