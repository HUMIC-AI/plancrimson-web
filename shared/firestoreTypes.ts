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

export const FAILING_GRADES = ['E', 'ABS', 'EXL', 'EXT', 'FL', 'UNSAT'] as const;

export type Grade = typeof PASSING_GRADES[number] | typeof FAILING_GRADES[number];

export const SEASON_ORDER = {
  Winter: 0,
  Spring: 1,
  Summer: 2,
  Fall: 3,
} as const;

export type Semester<YearType = number> = { year: YearType, season: Season };

export type Season = keyof typeof SEASON_ORDER;

// firestore user schema
export interface UserData {
  classYear: number;
  lastLoggedIn: Date;
  schedules: {
    [scheduleId: string]: Schedule;
  };
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
