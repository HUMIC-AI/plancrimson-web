/**
 * API types for reverse engineering my.harvard and the Q Guide.
 */

import { DayOfWeek, Season } from './firestoreTypes';

export type SearchParams = Partial<{
  search: string;
  pageNumber: number;
  facets: Array<string>;
  searchQuery: string;
  includeEvals: boolean;
  updateDb: boolean;
}>;

export type FailedClasses = Record<
string,
{
  error: string;
}
>;

export type SearchResults =
  | {
    classes: ExtendedClass[];
    facets: Facet[];
    searchProperties: SearchProperties;
    failedClasses?: FailedClasses;
  }
  | {
    error: string;
  };

export type ExtendedClass<PatternType = string | string[], TimeType = string | string[]> = Class<PatternType, TimeType> & {
  id: string; // for meilisearch
  textDescription: string;
  meanClassSize?: number;
  meanRating?: number;
  meanRecommendation?: number;
  meanHours?: number;
};

// ==================== FOUR YEAR PLAN RESPONSES ====================

type SeasArea =
  | 'ACS'
  | 'AP'
  | 'AM'
  | 'EE'
  | 'BE'
  | 'CS'
  | 'ESE'
  | 'General'
  | 'Mat & ME'
  | 'MSMBA'
  | 'SEM';

type Prefix =
  | 'AC'
  | 'AM'
  | 'AP'
  | 'BE'
  | 'CS'
  | 'EPS'
  | 'ES'
  | 'ESE'
  | 'FRSEMR'
  | 'GENED'
  | 'Gen'
  | 'SEMINAR';

export namespace SeasPlan {
  export interface SeasScheduleInfo {
    area: SeasArea;
    courseNumber: string;
    title: string;
    isUndergraduate: boolean;
    semesters: Array<SeasSemesterInfo>;
    prefix: Prefix;
    id: null;
  }

  export interface SeasSemesterInfo {
    academicYear: number;
    term: 'Fall' | 'Spring';
    instructors: Array<Instructor>;
    offeredStatus: 'Yes' | 'No' | '';
  }

  export interface Instructor {
    firstName: string;
    lastName: string;
  }
}

// ==================== MY.HARVARD AND COURSE EVALUATION TYPES BELOW ====================

export type MyHarvardResponse = [
  {
    Key: 'Results';
    ResultsCollection: Class[];
  },
  {
    Key: 'Facets';
    Facets: Facet[];
  },
  SearchProperties,
];

export interface Class<PatternType = string | string[], TimeType = string | string[]> {
  URL_URLNAME: string; // course website, eg "https://locator.tlt.harvard.edu/course/colgsas-125374/2021/spring/14433"

  // identical
  // course title, may contain html
  // eg "SEAS Teaching Practicum" or "Topics in Data Visualization"
  Name: string;
  Title: string;
  IS_SCL_DESCR100: string;

  // organizational info
  ACAD_ORG: string | string[]; // organizations, eg ["APMA", "CS", "APPHYS", "ENGSCI"]
  ACAD_ORG_PRIMARY_ORG: string; // primary organization, eg "CS"
  IS_SCL_DESCR_IS_SCL_DESCRJ: string; // department full name, eg "Computer Science"
  HU_ALIAS?: string; // see ACAD_ORG_PRIMARY_ORG, eg "CS"
  PARENT_NODE_NAME: string; // used for filtering on my.harvard, eg "SEAS"
  SUBJECT: string; // subject, eg "ENG-SCI" or "COMPSCI"
  IS_SCL_DESCR_IS_SCL_DESCRD: string; // subject full name, eg "Engineering Sciences"

  // catalog number
  CATALOG_NBR: string; // catalog number, eg " 301" or " 109B"
  HU_CAT_NBR_NL: string; // see CATALOG_NBR above without leading space, eg "326"

  // combined
  HU_SUBJ_CATLG_NBR: string; // subject and catalog number, eg "COMPSCI364"
  HU_SBJCT_CATNBR_NL: string; // see above
  HU_ALIAS_CATNBR_NS: string; // aliased subject and catalogue number, eg "CS290B"
  HU_ALIAS_CATNBR_NL: string; // aliased subject and catalog number, eg "CS171"

  SearchKey: string; // dunno, eg "QGJHBZSZQ7qzz8utcC2y2dKDIYk="
  IS_SCL_DESCR: string; // course description with html, eg "<p>Practicum emphasizing an active but reflective approach to teaching applied sciences and engineering...</p>"
  IS_SCL_DESCR_HU_SCL_DESCRNOHTML: string; // description (still with html), eg "<p>Cryptography is as old as human communication itself...</p>"

  // ==================== TIME RELATED FIELDS ====================

  Modified: string; // latest date modified, eg "2021-12-11 23:34:23.000000"

  DAY_OF_WEEK?: DayOfWeek | DayOfWeek[]; // days of the week, eg ["Monday", "Wednesday", "Friday"]
  IS_SCL_MEETING_PAT: PatternType; // see DAY_OF_WEEK, eg "Th"
  // "Y" or "N"
  MON: 'Y' | 'N';
  TUES: 'Y' | 'N';
  WED: 'Y' | 'N';
  THURS: 'Y' | 'N';
  FRI: 'Y' | 'N';
  SAT: 'Y' | 'N';

  EFFDT: string; // effective date, eg "2020-08-15-00.00.00.000000"
  ClassStartDt: string; // class start date eg "2022-01-24-00.00.00.000000"
  START_DT: string; // see above
  ClassEndDt: string; // class end date eg "2022-04-27-00.00.00.000000"
  END_DT: string; // see above
  ShopCartOpenCheck: 'Y' | 'N'; // dunno

  ACAD_YEAR: string; // academic year, eg "2022" (note that if in fall, this will be one higher than chronological year)
  IS_SCL_DESCR_IS_SCL_DESCRH: string; // semester, eg "2022 Spring"

  // if IS_SCL_MEETING_PAT is a string, then the below will all have the same type
  IS_SCL_TIME_START: PatternType extends string ? TimeType : (string | string[]); // time start, eg "3:45pm"
  IS_SCL_TIME_END: PatternType extends string ? TimeType : (string | string[]); // time end, eg "6:30pm"
  IS_SCL_STRT_TM_DEC: PatternType extends string ? TimeType : (string | string[]); // time start in decimal, eg "15.7500" or an array thereof
  IS_SCL_END_TM_DEC: PatternType extends string ? TimeType : (string | string[]); // time end in decimal, eg "18.5000"

  IS_SCL_DESCR_HU_SCL_EXAM_GROUP: string; // exam date, eg "12/15/2021 9:00 AM"

  // ==================== COURSE ORGANIZATION INFO ====================

  ACAD_CAREER: string; // school, eg "FAS"
  IS_SCL_DESCR_IS_SCL_DESCRB: string; // eg "Faculty of Arts and Sciences"
  IS_SCL_DESCR_IS_SCL_DESCRI: string; // see above

  // non user friendly
  CLASS_NBR: string; // not unique class number, eg "14433"
  CLASS_SECTION: string; // class section, eg "001"
  CRSE_ID: string; // course id, eg "219759", not unique e.g. for EXPOS
  HU_STRM_CLASSNBR: string; // term class number, eg "2218_17028"
  STRM: string; // term (dunno), eg "2222"
  IS_SCL_DESCR_HU_SCL_SESSION: string; // usually "Full Term"

  // ==================== OTHER COURSE INFO ====================

  SSR_COMPONENTDESCR: // course component, eg "Thesis Research" or "Lecture" or "Seminar"
  | 'Seminar'
  | 'Thesis Research'
  | 'Lecture'
  | 'Tutorial'
  | 'Reading and Research'
  | 'Project';

  IS_SCL_DESCR_IS_SCL_DESCRL: string | string[]; // instructor name, eg "Ariel Procaccia" or array thereof
  LAST_NAME: string | string[]; // last name of instructor or array of them, eg ["Protopapas", "Glickman"]

  LOCATION_DESCR_LOCATION: string; // eg "Cambridge Campus"
  IS_SCL_DESCR_IS_SCL_DESCRG: string; // detailed location, eg "SEC 1.321 Lecture Hall"

  // which courses this counts for, eg ["Faculty of Arts & Sciences}{2218}{12284}{STAT}{121A", "Faculty of Arts & Sciences}{2218}{13626}{APCOMP}{209A"]
  // maybe DESCRB}{STRM}{ACAD_ORG_PRIMARY_ORG}{HU_CAT_NBR_NL
  IS_SCL_DESCR_HU_SCL_XREG?: string | string[];

  IS_SCL_DESCR_HU_CONSENT: string; // eg "Instructor Consent Required" or "No Special Consent Required"
  IS_SCL_DESCRSHORT_HU_CONSENT: string; // see above, eg "No Consent" or "Instructor"

  ENRL_CAP: string; // enrolment cap, eg "999"
  ENRL_TOT: string; // total enrolled, eg "0"

  IS_SCL_DESCR100_HU_SCL_GRADE_BASIS:
  | 'FAS Letter Graded'
  | 'FAS Satisfactory/Unsatisfactory';

  IS_SCL_DESCR100_HU_SCL_ATTR_LEVL: string; // eg "Graduate Course" or "Primarily for Graduate Students" or "For Undergraduate and Graduate Students"
  CRSE_ATTR_VALUE_HU_LEVL_ATTR: string; // see above eg "GRADCOURSE" | "UGRDGRAD" | "PRIMGRAD"
  IS_SCL_DESCR100_HU_SCL_ATTR_GE?: // general education requirements
  | 'Aesthetics and Culture'
  | 'Science and Technology in Society'
  | 'Histories, Societies, Individuals'
  | 'Ethics and Civics';
  CRSE_ATTR_VALUE_HU_GE_ATTR?: // see above
  'A&C' | 'STS' | 'HSI' | 'E&C';
  IS_SCL_DESCR100_HU_SCL_ATTR_LDD?: // divisional distribution
  | 'Science & Engineering & Applied Science'
  | 'Arts and Humanities'
  | 'Social Sciences'
  | 'None';
  CRSE_ATTR_VALUE_HU_LDD_ATTR: string; // see above, eg "NONE" | "SCI"
  IS_SCL_DESCR100_HU_SCL_ATTR_LQR?: 'Yes'; // quantitative reasoning with data
  IS_SCL_DESCR100_HU_SCL_ATTR_XREG: string; // harvard cross registration, eg "Available for Harvard Cross Registration"
  CRSE_ATTR_VALUE_HU_XREG_ATTR: string; // see above, eg "YESXREG" | "NOXREG"

  HU_COURSE_PREQ: string; // other details, eg "This course will be offered in both an undergraduate and graduate versions. The graduate version will involve an additional project."

  HU_RECPREP_FLAG: string; // for existence of below, eg "Y" | "N"
  HU_REC_PREP?: string; // recommended preparation, eg "Can only be taken after successful completion of CS 109a..."

  HU_UNITS_MIN: string; // minimum number of units, eg "4"
  HU_UNITS_MAX: string; // maximum number of units, eg "4"

  // ==================== UNUSED OR UNKNOWN FIELDS ====================

  // identical
  // query parameters for my.harvard
  // eg "subject=ENG-SCI&catnbr=%20301&classsection=001&classnbr=14433&crseid=125374&strm=2222"
  Key: string;
  LinkURL: string;
  OriginalURL: string;

  Description: string; // has strange characters, eg "?p?Practicum emphasizing an active but reflective approach to teaching applied sciences and engineering; designed for graduate students in any <b>SEAS</b> area, not specifically Engineering Sciences.&nbsp; Topics: presentation and communication; in-class teaching and interaction; developing, grading",

  SESSION_CODE: string; // usually "1"
  PROFILEBUTTON?: string | string[]; // dunno, eg "X|*|Jelani Nelson|*||*||*||*|X"
  RQRMNT_GROUP: string; // usually empty string but sometimes a number, eg "003173"
  COOP_LINK: string; // weird xml stuff, eg "<?xml version=\"1.0\" encoding=\"UTF-8\"?><textbookorder><courses><course dept=\"ENSC\" num=\" 301\" sect=\"01\" term=\"W22\" /></courses></textbookorder>"

  Score: number; // dunno, eg 1
  EnhancedSponsored: boolean;
  HasActions: boolean;
  IsPeoplesoft: boolean;
  Sponsored: boolean;
  Removed: boolean;

  CLASS_STAT: string; // dunno, eg "A"
  CLASS_MTG_NBR: string; // dunno, eg "1"
  ENRL_STAT: string; // dunno, eg "O"

  SSR_DROP_CONSENT: string; // dunno, eg "Y" or "N"
  CONSENT: string; // dunno, eg "Y" or "N"

  CRS_TOPIC_ID: string; // usually "0"
  CRSE_OFFER_NBR: string; // usually "1"
  HU_CLS_SECN_DISP: string; // usually ""

  HU_INSTRUCT_MODE: string; // usually empty string
  HU_WAIT_CAP: string; // dunno, usually "0"
  HU_SEC_COMP_FLAG: 'Y' | 'N';
  HU_LATITUDE: string; // usually "0"
  HU_LONGITUDE: string; // usually "0"

  IS_SCL_DESCR_HU_SCL_SEC_COMP?: string | string[]; // dunno, eg "DIS|***|DIS|***|Discussion|***|DIS|*||*||*||*||*||*||*||*||*||*||*||*|0"
  IS_SCL_DESCR100_HU_SCL_ATTR_AREC?: string; // dunno, eg "MDE approved SEAS 100 level course"
  CRSE_ATTR_VALUE_HU_AREC_ATTR?: string; // eg "E-MDE-SEAS"
}

type AttributeDescriptions = Partial<{
  [attr in keyof Class]: string;
}>;

export const ATTRIBUTE_DESCRIPTIONS: AttributeDescriptions = {
  STRM: 'Term',
  SUBJECT: 'Subject',
  DAY_OF_WEEK: 'Day of week',
  ACAD_ORG: 'Department',
  LOCATION_DESCR_LOCATION: 'Location',
  SSR_COMPONENTDESCR: 'Class type',
  IS_SCL_DESCR100_HU_SCL_ATTR_LEVL: 'Level',
};

// const searchableAttributes = [
//   'Title', // eg "Abstraction and Design in Computation"
//   'SUBJECT', // eg "COMPSCI"
//   'CATALOG_NBR', // eg " 51"
//   'HU_SBJCT_CATNBR_NL', // eg "COMPSCI51"
//   'HU_ALIAS_CATNBR_NS', // eg "CS51"
//   'textDescription', // eg "Fundamental concepts in the design of computer programs..."

//   'DAY_OF_WEEK', // eg ["Tuesday", "Thursday"]
//   'ACAD_CAREER', // eg "FAS"
//   'ACAD_ORG', // eg "CS"

//   'LOCATION_DESCR_LOCATION', // eg "Allston Campus"
//   'SSR_COMPONENTDESCR', // eg "Lecture"
//   'HU_REC_PREP', // eg "Strongly recommended: CS 124 (or equivalent)..."
//   'HU_COURSE_PREQ', // eg "Enrollment limited to 30 students..."

//   'CRSE_ID', // eg "112960"
//   'CLASS_NBR', // eg "24111"

//   'IS_SCL_DESCR_IS_SCL_DESCRB', // eg "Faculty of Arts & Sciences"
//   'IS_SCL_DESCR_IS_SCL_DESCRD', // eg "Computer Science"
//   'IS_SCL_DESCR_IS_SCL_DESCRH', // eg "2022 Spring"
//   'IS_SCL_DESCR_IS_SCL_DESCRL', // eg ["Stephen Chong", "Brian Yu"]
//   'IS_SCL_DESCR_IS_SCL_DESCRJ', // eg "Computer Science"
//   'IS_SCL_DESCR_IS_SCL_DESCRG', // eg "SEC 1.402 Classroom"
//   'IS_SCL_DESCR100_HU_SCL_GRADE_BASIS', // eg "FAS Letter Graded"
//   'IS_SCL_DESCR100_HU_SCL_ATTR_LEVL', // eg "Primarily for Undergraduate Students"
// ];

export interface Facet {
  Key: string;

  FacetName: string;
  FacetLabel: string;
  FacetValue: string;
  DisplayValue: string;

  Path: string;
  PreviousPath: string;

  ParentFacetName: string;
  ParentFacetPath: string;

  HasChildren: boolean;
  FacetChildCollection?: Facet[];

  Count: number;
  Level: number;
  open: 'open';
  Selected: 'Selected';
}

export type SearchProperties = {
  Key: 'SearchProperties';
  HitCount: number;
  DocumentCount: number;
  PageSize: number;
  PageNumber: number;
  TotalPages: number;
  ResultStart: number;
  ResultEnd: number;
  SearchText: string;
  FacetsCount: number;
  SearchQuery: string;
  SearchTextOriginal: string;
  BoostEnabled: boolean;
  BoostMode: string;
  BoostScoreMode: string;
  BoostExcludeNonBoosted: string;
};

export interface Evaluation {
  url: string;
  year: number;
  season: Season;
  courseName: string;
  instructorName: string;
  comments?: string[] | null;
  'Course Response Rate'?: CourseResponseRate;
  'Course General Questions'?: CourseGeneralQuestions;
  'General Instructor Questions'?: GeneralInstructorQuestions;
  'On average, how many hours per week did you spend on coursework outside of class? Enter a whole number between 0 and 168.'?: HoursStats;
  'How strongly would you recommend this course to your peers?'?: RecommendationsStats;
  'What was/were your reason(s) for enrolling in this course? (Please check all that apply)'?: ReasonsForEnrolling;
  'What would you like to tell future students about this class?'?: string;
}

export type PossibleEvaluationResponse =
  | Evaluation
  | {
    url: string;
    error: string;
  };

export interface CourseGeneralQuestions {
  'Evaluate the course overall.': EvaluationStatistics;
  'Course materials (readings, audio-visual materials, textbooks, lab manuals, website, etc.)': EvaluationStatistics;
  'Assignments (exams, essays, problem sets, language homework, etc.)': EvaluationStatistics;
  'Feedback you received on work you produced in this course': EvaluationStatistics;
  'Section component of the course': EvaluationStatistics | null;
  'Pointed to Dissertation Topic or Research Lab'?: EvaluationStatistics;
  'Helped Develop Research Skills'?: EvaluationStatistics;
  'Could be Developed into Talks or Publications'?: EvaluationStatistics;
  'Helped Prepare for Generals'?: EvaluationStatistics;
}

export interface EvaluationStatistics {
  count: number;
  votes: number[] | null;
  courseMean: number | null;
  fasMean: number | null;
}

export interface CourseResponseRate {
  responded: number;
  invited: number;
}

export interface GeneralInstructorQuestions {
  'Evaluate your Instructor overall.': EvaluationStatistics;
  'Gives effective lectures or presentations, if applicable': EvaluationStatistics;
  'Is accessible outside of class (including after class, office hours, e-mail, etc.)': EvaluationStatistics;
  'Generates enthusiasm for the subject matter'?: EvaluationStatistics;
  'Facilitates discussion and encourages participation': EvaluationStatistics;
  'Gives useful feedback on assignments': EvaluationStatistics;
  'Returns assignments in a timely fashion': EvaluationStatistics;
}

export interface RecommendationsStats {
  recommendations: number[] | null;
  count: number;
  ratio: number;
  mean: number | null;
  median: number | null;
  stdev: number | null;
}

export interface HoursStats {
  count: number;
  ratio: number;
  mean: number | null;
  median: number | null;
  mode: number | null;
  stdev: number | null;
}

export interface ReasonsForEnrolling {
  elective: number;
  concentration: number;
  secondary: number;
  gened: number;
  expos: number;
  language: number;
  premed: number;
  distribution: number;
  qrd: number;
}
