import { connectInfiniteHits } from 'react-instantsearch-dom';
import React, {
// useEffect, useRef, useState,
} from 'react';
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
  // setNumCols: React.Dispatch<React.SetStateAction<number>>;
};

// function getNumCols(buttonWidth: number) {
//   return (Math.floor((192 - buttonWidth) / 20) + 1);
// }

const CustomButton: React.FC<ButtonProps> = function ({
  onClick, enabled, direction,
  // setNumCols,
}) {
  // const ref = useRef<HTMLButtonElement>(null!);
  // useEffect(() => {
  //   const observer = new ResizeObserver(([{ borderBoxSize: [{ inlineSize }] }]) => {
  //     const newNumCols = getNumCols(inlineSize);
  //     setNumCols(newNumCols);
  //   });
  //   observer.observe(ref.current);
  //   return () => observer.disconnect();
  // }, [setNumCols]);

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!enabled}
      // ref={ref}
      className={classNames(
        enabled ? 'bg-gray-800 hover:opacity-50' : 'bg-gray-600 cursor-not-allowed',
        'p-2 shadow w-48 min-w-[84px] max-w-[192px] rounded text-white transition-opacity resize-x overflow-auto',
        'flex justify-center',
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
  // const [numCols, setNumCols] = useState(getNumCols(144));

  return (
    <div className="space-y-6 flex flex-col items-center">
      <CustomButton
        enabled={hasPrevious}
        onClick={refinePrevious}
        direction="up"
        // setNumCols={setNumCols}
      />

      <div
        className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4"
        // style={{
        //   gridTemplateColumns: `repeat(${numCols}, minmax(0, 1fr))`,
        // }}
      >
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

      <CustomButton
        enabled={hasMore}
        onClick={refineNext}
        direction="down"
        // setNumCols={setNumCols}
      />
    </div>
  );
};

export default connectInfiniteHits(HitsComponent);
