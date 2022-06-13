export const DAY_SHORT = ['MON', 'TUES', 'WED', 'THURS', 'FRI', 'SAT'] as const;

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

export const SEASON_ORDER = {
  Winter: 0,
  Spring: 1,
  Summer: 2,
  Fall: 3,
} as const;

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
