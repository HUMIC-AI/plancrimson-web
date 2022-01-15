import { connectInfiniteHits } from 'react-instantsearch-dom';
import React, {
// useEffect, useRef, useState,
} from 'react';
import type { InfiniteHitsProvided } from 'react-instantsearch-core';
import { FaArrowsAltV, FaChevronDown, FaChevronUp } from 'react-icons/fa';
import {
  ExtendedClass,
} from '../../shared/apiTypes';
import useSelectedScheduleContext from '../../src/context/selectedSchedule';
import { classNames, getClassId } from '../../shared/util';
import CourseCard from '../Course/CourseCard';
import CourseDialog from '../Course/CourseDialog';
import { useCourseDialog } from '../../src/hooks';
import useCardStyle from '../../src/context/cardStyle';

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
  const { isExpanded, expand } = useCardStyle();

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
    <div className="relative">
      <button
        type="button"
        onClick={onClick}
        disabled={!enabled}
      // ref={ref}
        className={classNames(
          enabled ? 'bg-gray-800 hover:opacity-50' : 'bg-gray-300 cursor-not-allowed',
          'p-2 shadow w-48 min-w-[84px] max-w-full sm:max-w-[192px] rounded text-white transition-opacity',
          // 'resize-x overflow-auto',
          'flex justify-center',
        )}
      >
        {direction === 'up' && <FaChevronUp />}
        {direction === 'down' && <FaChevronDown />}
      </button>
      <button
        type="button"
        onClick={() => expand(!isExpanded)}
        className={classNames(
          isExpanded ? 'bg-white text-gray-800' : 'bg-gray-800 text-white',
          'rounded-full hover:opacity-50 p-1 absolute inset-y-0 left-full ml-4 border',
        )}
      >
        <FaArrowsAltV />
      </button>
    </div>
  );
};

export const HitsComponent: React.FC<InfiniteHitsProvided<ExtendedClass> & { inSearch?: boolean }> = function ({
  hits, hasPrevious, hasMore, refinePrevious, refineNext, inSearch = true,
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
      />

      {hits.length === 0 ? <div className="animate-pulse py-2 px-4 rounded-full bg-gray-300">Loading results...</div>
        : (
          <div
            className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4"
          >
            {hits.map((hit) => (
              <CourseCard
                key={getClassId(hit)}
                course={hit}
                selectedSchedule={selectedSchedule}
                handleExpand={handleExpand}
                inSearchContext={inSearch}
              />
            ))}
            <CourseDialog
              isOpen={isOpen}
              course={openedCourse}
              closeModal={closeModal}
            />
          </div>
        )}

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
