// see https://infoforfaculty.fas.harvard.edu/book/grading-system
export const grade = {
  A: '',
  'A-': '',
  'B+': '',
  B: '',
  'B-': '',
  'C+': '',
  C: '',
  'C-': '',
  'D+': '',
  D: '',
  'D-': '',
  E: '',
  ABS: '',
  EXL: '',
  EXT: '',
  PA: 'Pass', // A to D-
  FL: 'Fail',
  SAT: 'Satisfactory', // A to C-
  UNSAT: 'Unsatisfactory',
} as const;

export const FAILING_GRADES = ['E', 'ABS', 'EXL', 'FL', 'UNSAT'];

export const seasonOrder = {
  Winter: 0,
  Spring: 1,
  Summer: 2,
  Fall: 3,
} as const;

export type Semester = { year: number, season: Season };

export type Season = keyof typeof seasonOrder;

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
  grade?: keyof typeof grade;
}
