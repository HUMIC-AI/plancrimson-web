import { connectHits } from 'react-instantsearch-dom';
import React, { useState } from 'react';
import {
  ExtendedClass,
} from '../../shared/apiTypes';
import useSearchPageContext from '../../src/context/searchPage';
import { getClassId } from '../../shared/util';
import CourseCard from '../Course/CourseCard';
import CourseDialog from '../Course/CourseDialog';

const Hits = connectHits<ExtendedClass>(({ hits }) => {
  const { selectedSchedule } = useSearchPageContext();
  const [isOpen, setIsOpen] = useState(false);
  const [openedCourse, openCourse] = useState<ExtendedClass | null>(null);
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 xl:grid-cols-4 gap-4">
      {hits.map((hit) => (
        <CourseCard
          key={getClassId(hit)}
          course={hit}
          selectedSchedule={selectedSchedule}
          handleExpand={() => {
            openCourse(hit);
            setIsOpen(true);
          }}
        />
      ))}
      <CourseDialog
        isOpen={isOpen}
        course={openedCourse}
        closeModal={() => setIsOpen(false)}
      />
    </div>
  );
});

export default Hits;
