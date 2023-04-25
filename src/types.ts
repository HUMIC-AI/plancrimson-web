import type {
  Concentration,
  DayOfWeek,
  FAILING_GRADES, PASSING_GRADES, Semester, Term,
} from '@/src/lib';

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
}

export interface CustomTimeRecord {
  pattern: DayOfWeek[],
  start: number; // decimal hour
  end: number; // decimal hour
  startDate: string; // yyyy-mm-dd
  endDate: string; // yyyy-mm-dd
}

// ============================== /schedules ==============================

/**
 * The Firestore schema for the /schedules collection.
 */
export interface Schedule extends Semester {
  id: string; // global unique id, a uuidv4 (NOT a firestore default assigned id)
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
  [scheduleId: ScheduleId]: Schedule;
}

export type ScheduleId = string;

export type ScheduleIdOrSemester = Semester | ScheduleId;

export type ListOfScheduleIdOrSemester = ScheduleId[] | Semester[];

export type CourseLevel = 'all' | 'undergrad' | 'grad';
