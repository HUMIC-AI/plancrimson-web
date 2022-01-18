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

export type Grade =
  | typeof PASSING_GRADES[number]
  | typeof FAILING_GRADES[number];

export const SEASON_ORDER = {
  Winter: 0,
  Spring: 1,
  Summer: 2,
  Fall: 3,
} as const;

export type Semester = { year: number; season: Season };

export type Season = keyof typeof SEASON_ORDER;

export type Term = `${number}${Season}`;

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

export type Viability = 'Yes' | 'Likely' | 'Unlikely' | 'No';

export type DayOfWeek = typeof DAYS_OF_WEEK[number];

// firestore user schema
export interface UserData {
  classYear: number;
  lastLoggedIn: Date;
  schedules: {
    [scheduleId: string]: Schedule;
  };
  selectedSchedules: {
    [term: Term]: string | null;
  };
  customTimes: Record<ClassId, {
    pattern: DayOfWeek[],
    start: number; // decimal hour
    end: number; // decimal hour
  }>;
}

export interface Schedule {
  id: string;
  year: number;
  season: Season;
  classes: UserClassData[];
}

// an entry in a schedule
export interface UserClassData {
  classId: string;
  grade?: Grade;
}

export interface DownloadPlan {
  id: string;
  schedules: Schedule[];
}
