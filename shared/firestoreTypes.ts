import { Concentration } from './assets/concentrations';

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

// ============================== /users ==============================

/**
 * The schema of the actual Firestore user document.
 * Contains user metadata and their schedule metadata.
 * Actual schedules are stored in the schedules Firestore collection.
 */
export type UserDocument<DateType> = UserMetadata<DateType> & ScheduleMetadata;

export interface UserMetadata<DateType> {
  username: string | null;
  classYear: number | null;
  lastLoggedIn: DateType | null;
  concentrationRanking: Concentration[] | null;
}

// Contains a user's selected schedules, custom class times, and waived reqs.
export interface ScheduleMetadata {
  selectedSchedules: {
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

  // TODO move this to session storage instead of firestore
  hiddenScheduleIds: string[]; // hidden schedules
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
