import React, { useState } from 'react';
import { FaMinusCircle, FaPlusCircle } from 'react-icons/fa';
import cheerio from 'cheerio';
import useSWR from 'swr';
import { Class, EvaluationResponse } from '../../shared/apiTypes';
import fetcher from '../../shared/fetcher';
import useUserData from '../../src/context/userData';
import { Schedule } from '../../src/firestoreTypes';
import { getClassId } from '../../src/util';

export function getYearAndSeason(course: Class) {
  const season = /Fall/i.test(course.IS_SCL_DESCR_IS_SCL_DESCRH) ? 'Fall' : 'Spring' as const;
  const academicYear = parseInt(course.ACAD_YEAR, 10);
  const year = season === 'Fall' ? academicYear - 1 : academicYear;
  return { year, season };
}

export function getSemesters(startYear: number) {
  return [...new Array(5)].flatMap((_, i) => [
    { year: startYear + i, season: 'Spring' },
    { year: startYear + i, season: 'Fall' },
  ]).slice(1, -1); // get rid of first and last since of mismatch
}

const colors = ['bg-blue-300', 'bg-yellow-300', 'bg-green-300', 'bg-gray-300', 'bg-red-300'];

const Percentages = function ({ categories }: { categories: Array<number> }) {
  const total = categories.reduce((acc, val) => acc + val, 0);
  return (
    <div className="rounded overflow-hidden h-6">
      {categories
        .filter((val) => val > 0)
        .reverse()
        .map((rec, i) => (
          <div
            className={`inline-block h-full ${colors[i]}`}
            style={{ width: `${(rec / total) * 100}%` }}
          />
        ))}
    </div>
  );
};

const Evaluation: React.FC<{ report: EvaluationResponse }> = function ({ report }) {
  const {
    mean, median, mode, stdev,
  } = report['On average, how many hours per week did you spend on coursework outside of class? Enter a whole number between 0 and 168.'];
  return (
    <div className="rounded border-black border-2 p-2 flex flex-col items-stretch gap-4">
      <div className="flex justify-between items-center border-black border-b-2 pb-2">
        <h3 className="font-bold">
          {`${report.term} ${report.season}`}
        </h3>
        <a href={report.url} className="text-blue-300 hover:text-blue-500">
          View report
        </a>
      </div>

      <div>
        <h4 className="font-bold">Recommendations</h4>
        <Percentages categories={report['How strongly would you recommend this course to your peers?'].recommendations} />
      </div>

      <div>
        <h4 className="font-bold">Overall evaluation</h4>
        <Percentages categories={report['Course General Questions']['Evaluate the course overall.'].votes.slice().reverse()} />
      </div>

      <div>
        <h4 className="font-bold">Hours per week (outside of class)</h4>
        <p>
          {`Mean: ${mean} | Median: ${median} | Mode: ${mode} | Stdev: ${stdev}`}
        </p>
      </div>
    </div>
  );
};

const Course: React.FC<{
  course: Class;
  schedule: Schedule | null;
}> = function ({ course, schedule }) {
  const {
    ACAD_CAREER: school,
    IS_SCL_DESCR100: title,
    IS_SCL_DESCR_IS_SCL_DESCRH: term,
    IS_SCL_DESCR_IS_SCL_DESCRL: instructors,
    HU_REC_PREP: prereqs,
    IS_SCL_DESCR: rawDescription,
    IS_SCL_TIME_START: startTime,
    SUBJECT: subject,
    CATALOG_NBR: catalogNumber,
    IS_SCL_TIME_END: endTime,
    IS_SCL_MEETING_PAT: meetingPattern,
    SSR_COMPONENTDESCR: componentDescription,
    IS_SCL_DESCR100_HU_SCL_GRADE_BASIS: gradingBasis,
  } = course;
  const courseLabel = subject + catalogNumber;

  const {
    addCourses, removeCourses,
  } = useUserData();
  const [loadFeedback, setLoadFeedback] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const { data: feedback, error } = useSWR(loadFeedback ? {
    method: 'GET',
    url: '/api/feedback',
    params: {
      school,
      course: courseLabel,
    },
  } : null, fetcher);

  // when user clicks "add" button,
  // should show a dropdown containing:
  // for each semester this course is available in,
  // all of the user's schedules for that semester

  // if this course is in any of the user's schedules,
  // should show the name of the semester along with an `x` to remove the course

  const classId = getClassId(course);
  const description = cheerio(rawDescription).text();
  return (
    <div className="border-black border-2 rounded-md p-2 space-y-2">
      <h3 className="flex items-center justify-between text-xl">
        {title}
        {schedule && (schedule.classes.find(({ classId: id }) => id === classId)
          ? (
            <button type="button" onClick={() => removeCourses({ classId })}>
              <FaMinusCircle />
            </button>
          )
          : (
            <button type="button" onClick={() => addCourses({ classId, scheduleId: schedule.id })}>
              <FaPlusCircle />
            </button>
          ))}
      </h3>
      <hr className="border-black" />
      <div className="flex justify-between items-center">
        <span>{courseLabel}</span>
        <span className="border-l border-r border-black sm:border-none text-center px-2">
          {term}
          <br className="sm:hidden" />
          <span className="hidden sm:inline">, </span>
          {meetingPattern === 'TBA' ? 'Time TBA' : `${meetingPattern} ${startTime}–${endTime}`}
        </span>
        <span className="text-right">{componentDescription}</span>
      </div>
      <hr className="border-black" />
      <div className="flex justify-between items-center">
        <span>
          {Array.isArray(instructors) ? instructors.join(', ') : instructors}
        </span>
        <span>{gradingBasis}</span>
      </div>

      {(description || prereqs) && <hr className="border-black" />}

      {description && (
      <div className="line-clamp-3">
        <p>{description}</p>
      </div>
      )}

      {prereqs && (
      <p>
        <span className="font-bold">Recommended Prep:</span>
        {' '}
        {prereqs}
      </p>
      )}
      <div>
        <button
          type="button"
          onClick={() => {
            setShowFeedback((val) => !val);
            if (!loadFeedback) setLoadFeedback(true);
          }}
          className="text-blue-300 hover:text-blue-500 transition-colors"
        >
          {/* eslint-disable-next-line no-nested-ternary */}
          {showFeedback ? 'Hide course feedback' : (loadFeedback ? 'Show course feedback' : 'Load course feedback')}
        </button>
      </div>
      {error
      && (
      <p>
        Error loading course feedback:
        {' '}
        {JSON.stringify(error)}
      </p>
      )}

      {/* Evaluations */}
      {showFeedback && (
      <div className="">
        {feedback ? (Array.isArray(feedback) && (feedback.length === 0
          ? 'No evaluations found'
          : feedback.map((report) => <Evaluation report={report} />)))
          : 'Loading feedback...'}
      </div>
      )}
    </div>
  );
};

export default Course;
