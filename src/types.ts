import type {
  Concentration,
  DayOfWeek,
  FAILING_GRADES, PASSING_GRADES, Semester, Term,
} from '@/src/lib';
import type { Timestamp } from 'firebase/firestore';

// ============================== /metadata/metadata ==============================

export interface Metadata {
  whiteList: string[];
  meiliApiKey: string;
}

// ============================== /alerts ==============================

export interface Alert {
  alert: string;
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

export type WithId<T> = T & { id: string };

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

  pairwiseRankings: Array<{
    class1: string;
    class2: string;
    choice: ChoiceRank;
  }>;
}

export interface CustomTimeRecord {
  pattern: DayOfWeek[],
  start: number; // decimal hour
  end: number; // decimal hour
  startDate: string; // yyyy-mm-dd
  endDate: string; // yyyy-mm-dd
}

export type ChoiceRank = -1 | 0 | 1;

// ============================== /schedules ==============================

/**
 * The Firestore schema for the /schedules collection.
 */
export interface BaseSchedule extends Semester {
  id: string; // global unique id, a uuidv4 (NOT a firestore default assigned id)
  title: string;
  ownerUid: string; // uid of the user that created this schedule
  classes?: string[]; // originally required but later not due to more efficient firestore queries
  public: boolean;
}

export interface FirestoreSchedule extends BaseSchedule {
  createdAt: Timestamp;
}

export interface LocalSchedule extends BaseSchedule {
  createdAt: string; // that encodes a date
}

export type Grade = typeof PASSING_GRADES[number] | typeof FAILING_GRADES[number];

// ============================== /allFriends/{from}/friends ==============================

// schema for the /allFriends/{from}/friends/{to} documents
export interface FriendRequest {
  from: string; // uid
  to: string; // uid
  accepted: boolean;
}

// ============================== /games ==============================

export interface GameRecord {
  createdAt: Timestamp;
  userId: string;
  sourceId: string;
  targetId: string;
  milliseconds: number;
  maxCourses: number;
  difficulty: number;
  hintsUsed: number;
}

// ============================== misc ==============================

export type Viability = 'Yes' | 'Likely' | 'Unlikely' | 'No';

export interface DownloadPlan {
  id: string;
  schedules: LocalSchedule[];
}

// maps from ids to schedules
export interface ScheduleMap {
  [scheduleId: ScheduleId]: LocalSchedule;
}

export type ScheduleId = string;

export type ScheduleIdOrSemester = Semester | ScheduleId;

export type ListOfScheduleIdOrSemester = ScheduleId[] | Semester[];

export type CourseLevel = 'all' | 'undergrad' | 'grad';
