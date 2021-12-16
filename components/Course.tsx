import React from 'react';
import { FaMinusCircle, FaPlusCircle } from 'react-icons/fa';
import { Course as CourseType } from '../src/types';

const Course = function ({ course, mySchedule, setMySchedule }: {
  course: CourseType;
  mySchedule: CourseType[];
  setMySchedule: React.Dispatch<React.SetStateAction<CourseType[]>>;
}) {
  const {
    Key: key,
    IS_SCL_DESCR100: title,
    IS_SCL_DESCR_IS_SCL_DESCRH: term,
    IS_SCL_DESCR_IS_SCL_DESCRL: instructors,
    HU_REC_PREP: prereqs,
    HU_SUBJ_CATLG_NBR: catalogNumber,
    IS_SCL_DESCR: rawDescription,
    IS_SCL_TIME_START: startTime,
    IS_SCL_TIME_END: endTime,
    IS_SCL_MEETING_PAT: meetingPattern,
    SSR_COMPONENTDESCR: componentDescription,
    IS_SCL_DESCR100_HU_SCL_GRADE_BASIS: gradingBasis,
  } = course;

  const description = rawDescription.replaceAll(/<\/?.>/g, '').replace(/&nbsp;/g, ' ').replace(/\s+/, ' ').trim();
  return (
    <div className="border-black border-2 rounded-md p-2 space-y-2">
      <h3 className="flex items-center justify-between text-xl">
        {title}
        {typeof mySchedule.find((c) => c.Key === key) === 'undefined'
          ? (
            <button type="button" onClick={() => setMySchedule((prev) => [...prev, course])}>
              <FaPlusCircle />
            </button>
          )
          : (
            <button type="button" onClick={() => setMySchedule((prev) => prev.filter((c) => c.Key !== key))}>
              <FaMinusCircle />
            </button>
          )}
      </h3>
      <hr className="border-black" />
      <div className="flex justify-between items-center">
        <span>{catalogNumber}</span>
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
      {description && <p>{description}</p>}
      {prereqs && (
      <p>
        <span className="font-bold">Recommended Prep:</span>
        {' '}
        {prereqs}
      </p>
      )}
    </div>
  );
};

export default Course;
