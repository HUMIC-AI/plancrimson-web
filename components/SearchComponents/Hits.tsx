import { connectHits } from 'react-instantsearch-dom';
import React from 'react';
import {
  ExtendedClass,
} from '../../shared/apiTypes';
import useSelectedScheduleContext from '../../src/context/selectedSchedule';
import { getClassId } from '../../shared/util';
import CourseCard from '../Course/CourseCard';
import CourseDialog from '../Course/CourseDialog';
import { useCourseDialog } from '../../src/hooks';

const Hits = connectHits<ExtendedClass>(({ hits }) => {
  const { selectedSchedule } = useSelectedScheduleContext();
  const {
    isOpen, openedCourse, closeModal, handleExpand,
  } = useCourseDialog();
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 xl:grid-cols-4 gap-4">
      {hits.map((hit) => (
        <CourseCard
          key={getClassId(hit)}
          course={hit}
          selectedSchedule={selectedSchedule}
          handleExpand={handleExpand}
        />
      ))}
      <CourseDialog
        isOpen={isOpen}
        course={openedCourse}
        closeModal={closeModal}
      />
    </div>
  );
});

export default Hits;
