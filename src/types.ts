/* eslint-disable max-len */
export interface Course {
  Key: string; // "subject=ENG-SCI&catnbr=%20301&classsection=001&classnbr=14433&crseid=125374&strm=2222",
  LinkURL: string; // "subject=ENG-SCI&catnbr=%20301&classsection=001&classnbr=14433&crseid=125374&strm=2222",
  OriginalURL: string; // "subject=ENG-SCI&catnbr=%20301&classsection=001&classnbr=14433&crseid=125374&strm=2222",
  URL_URLNAME: string; // Q Guide URL

  Name: string; // "<b>SEAS</b> Teaching Practicum",
  Title: string; // "<b>SEAS</b> Teaching Practicum",

  EnhancedSponsored: boolean;
  HasActions: boolean;
  IsPeoplesoft: boolean;
  Sponsored: boolean;
  Removed: boolean;

  SearchKey: string; // "QGJHBZSZQ7qzz8utcC2y2dKDIYk=",
  Description: string; // "?p?Practicum emphasizing an active but reflective approach to teaching applied sciences and engineering; designed for graduate students in any <b>SEAS</b> area, not specifically Engineering Sciences.&nbsp; Topics: presentation and communication; in-class teaching and interaction; developing, grading",
  Score: number; // 1
  Modified: Date;
  ClassStartDt: string;
  ClassEndDt: string;
  ShopCartOpenCheck: string;

  ACAD_CAREER: string; // FAS
  ACAD_ORG: string | string[]; // ["APMA","CS","APPHYS","ENGSCI"]
  ACAD_YEAR: string; // 2022
  ACAD_ORG_PRIMARY_ORG: string;

  CLASS_NBR: string; // "14433",
  CLASS_SECTION: string; // "001"
  CLASS_STAT: string;
  CLASS_MTG_NBR: string;

  SUBJECT: string; // "ENG-SCI",
  CATALOG_NBR: string; // " 301",
  STRM: string; // "2222"
  ENRL_STAT: string;
  LAST_NAME: string;

  SSR_DROP_CONSENT: string;
  CONSENT: string;

  RQRMNT_GROUP: string;
  PARENT_NODE_NAME: string;
  SESSION_CODE: string;
  BLDG_CD: string;
  PROFILEBUTTON: string;
  SSR_COMPONENTDESCR: string;
  LOCATION_DESCR_LOCATION: string;
  COOP_LINK: string;

  ENRL_CAP: string;
  ENRL_TOT: string;

  EFFDT: string;
  START_DT: string;
  END_DT: string;

  IS_SCL_END_TM_DEC: string;
  IS_SCL_STRT_TM_DEC: string;
  IS_SCL_MEETING_PAT: string;
  IS_SCL_TIME_END: string;
  IS_SCL_TIME_START: string;

  IS_SCL_DESCR: string; // "<p>Practicum emphasizing an active but reflective approach to teaching applied sciences and engineering; designed for graduate students in any SEAS area, not specifically Engineering Sciences.&nbsp; Topics: presentation and communication; in-class teaching and interaction; developing, grading and giving feedback on assignments; course head / TF relations and expectations; cognition and learning. Seminar style with an emphasis on observation, practice, feedback, and reflection. While the primary context of the course is classroom-style teaching, those interested in developing instructional communication skills in other contexts within science and engineering -- labs/studios, presentations, etc. -- are quite welcome, and course tasks can be adjusted for such.</p>",
  IS_SCL_DESCR_IS_SCL_DESCRB: string; // Faculty of Arts and Sciences
  IS_SCL_DESCR_IS_SCL_DESCRD: string;
  IS_SCL_DESCR_IS_SCL_DESCRH: string;
  IS_SCL_DESCR_IS_SCL_DESCRI: string;
  IS_SCL_DESCR_IS_SCL_DESCRL: string;
  IS_SCL_DESCR_IS_SCL_DESCRJ: string;
  IS_SCL_DESCR_IS_SCL_DESCRG: string;

  IS_SCL_DESCR_HU_CONSENT: string; // Instructor
  IS_SCL_DESCRSHORT_HU_CONSENT: string; //  Instructor Consent Required
  IS_SCL_DESCR_HU_SCL_EXAM_GROUP: string;
  IS_SCL_DESCR_HU_SCL_SESSION: string;
  IS_SCL_DESCR_HU_SCL_DESCRNOHTML: string;
  IS_SCL_DESCR_HU_SCL_XREG: string; // Cross register
  IS_SCL_DESCR_HU_SCL_SEC_COMP: string;

  IS_SCL_DESCR100: string;
  IS_SCL_DESCR100_HU_SCL_ATTR_LDD: string;
  IS_SCL_DESCR100_HU_SCL_GRADE_BASIS: string;
  IS_SCL_DESCR100_HU_SCL_ATTR_LEVL: string;
  IS_SCL_DESCR100_HU_SCL_ATTR_AREC: string;
  IS_SCL_DESCR100_HU_SCL_ATTR_XREG: string;

  CRS_TOPIC_ID: string;
  CRSE_ID: string;
  CRSE_OFFER_NBR: string;
  CRSE_ATTR_VALUE_HU_LEVL_ATTR: string;
  CRSE_ATTR_VALUE_HU_LDD_ATTR: string;
  CRSE_ATTR_VALUE_HU_XREG_ATTR: string;
  CRSE_ATTR_VALUE_HU_AREC_ATTR: string;

  DAY_OF_WEEK: string | string[];
  // Y/N
  MON: string;
  TUES: string;
  WED: string;
  THURS: string;
  FRI: string;
  SAT: string;

  HU_CLS_SECN_DISP: string;
  HU_ALIAS: string;
  HU_ALIAS_CATNBR_NL: string;
  HU_COURSE_PREQ: string;
  HU_SEC_COMP_FLAG: string;

  HU_INSTRUCT_MODE: string;
  HU_STRM_CLASSNBR: string;
  HU_SUBJ_CATLG_NBR: string;
  HU_ALIAS_CATNBR_NS: string;
  HU_CAT_NBR_NL: string;
  HU_SBJCT_CATNBR_NL: string;
  HU_WAIT_CAP: string;

  HU_UNITS_MIN: string;
  HU_UNITS_MAX: string;

  HU_RECPREP_FLAG: string;
  HU_REC_PREP: string;

  HU_LATITUDE: string;
  HU_LONGITUDE: string;
}

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

export type MyHarvardResponse = [
  {
    Key: 'Results';
    ResultsCollection: Course[];
  },
  {
    Key: 'Facets';
    Facets: Facet[];
  },
  SearchProperties,
];

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

export interface EvaluationResponse {
  url: string;
  term: number;
  season: string;
  'Course Response Rate': CourseResponseRate;
  'Course General Questions': CourseGeneralQuestions;
  'General Instructor Questions': GeneralInstructorQuestions;
  'On average, how many hours per week did you spend on coursework outside of class? Enter a whole number between 0 and 168.': OnAverageHowManyHoursPerWeekDidYouSpendOnCourseworkOutsideOfClassEnterAWholeNumberBetween0And168;
  'How strongly would you recommend this course to your peers?': HowStronglyWouldYouRecommendThisCourseToYourPeers;
}

export interface CourseGeneralQuestions {
  'Evaluate the course overall.': AssignmentsExamsEssaysProblemSetsLanguageHomeworkEtc;
  'Course materials (readings, audio-visual materials, textbooks, lab manuals, website, etc.)': AssignmentsExamsEssaysProblemSetsLanguageHomeworkEtc;
  'Assignments (exams, essays, problem sets, language homework, etc.)': AssignmentsExamsEssaysProblemSetsLanguageHomeworkEtc;
  'Feedback you received on work you produced in this course': AssignmentsExamsEssaysProblemSetsLanguageHomeworkEtc;
  'Section component of the course': AssignmentsExamsEssaysProblemSetsLanguageHomeworkEtc;
}

export interface AssignmentsExamsEssaysProblemSetsLanguageHomeworkEtc {
  count: string;
  votes: number[];
  courseMean: number;
  fasMean: number;
}

export interface CourseResponseRate {
  responded: number;
  invited: number;
}

export interface GeneralInstructorQuestions {
  'Evaluate your Instructor overall.': AssignmentsExamsEssaysProblemSetsLanguageHomeworkEtc;
  'Gives effective lectures or presentations, if applicable': AssignmentsExamsEssaysProblemSetsLanguageHomeworkEtc;
  'Is accessible outside of class (including after class, office hours, e-mail, etc.)': AssignmentsExamsEssaysProblemSetsLanguageHomeworkEtc;
  'Generates enthusiasm for the subject matter': AssignmentsExamsEssaysProblemSetsLanguageHomeworkEtc;
  'Facilitates discussion and encourages participation': AssignmentsExamsEssaysProblemSetsLanguageHomeworkEtc;
  'Gives useful feedback on assignments': AssignmentsExamsEssaysProblemSetsLanguageHomeworkEtc;
  'Returns assignments in a timely fashion': AssignmentsExamsEssaysProblemSetsLanguageHomeworkEtc;
}

export interface HowStronglyWouldYouRecommendThisCourseToYourPeers {
  recommendations: number[];
  total: number;
  ratio: number;
  mean: number;
  median: number;
  stdev: number;
}

export interface OnAverageHowManyHoursPerWeekDidYouSpendOnCourseworkOutsideOfClassEnterAWholeNumberBetween0And168 {
  count: number;
  ratio: number;
  mean: number;
  median: number;
  mode: number;
  stdev: number;
}
