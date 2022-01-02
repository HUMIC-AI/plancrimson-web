import { connectInfiniteHits } from 'react-instantsearch-dom';
import React from 'react';
import type { InfiniteHitsProvided } from 'react-instantsearch-core';
import { FaChevronDown, FaChevronUp } from 'react-icons/fa';
import {
  ExtendedClass,
} from '../../shared/apiTypes';
import useSelectedScheduleContext from '../../src/context/selectedSchedule';
import { classNames, getClassId } from '../../shared/util';
import CourseCard from '../Course/CourseCard';
import CourseDialog from '../Course/CourseDialog';
import { useCourseDialog } from '../../src/hooks';

type ButtonProps = {
  onClick: () => void;
  enabled: boolean;
  direction: 'up' | 'down';
};

const CustomButton: React.FC<ButtonProps> = function ({ onClick, enabled, direction }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!enabled}
      className={classNames(
        enabled ? 'bg-gray-800 hover:opacity-50' : 'bg-gray-600 cursor-not-allowed',
        'p-2 shadow w-48 max-w-full flex justify-center mx-auto rounded text-white transition-opacity',
      )}
    >
      {direction === 'up' && <FaChevronUp />}
      {direction === 'down' && <FaChevronDown />}
    </button>
  );
};

export const HitsComponent: React.FC<InfiniteHitsProvided<ExtendedClass>> = function ({
  hits, hasPrevious, hasMore, refinePrevious, refineNext,
}) {
  const { selectedSchedule } = useSelectedScheduleContext();
  const {
    isOpen, openedCourse, closeModal, handleExpand,
  } = useCourseDialog();
  return (
    <div className="space-y-6">
      <CustomButton enabled={hasPrevious} onClick={refinePrevious} direction="up" />

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

      <CustomButton enabled={hasMore} onClick={refineNext} direction="down" />
    </div>
  );
};

export default connectInfiniteHits(HitsComponent);
