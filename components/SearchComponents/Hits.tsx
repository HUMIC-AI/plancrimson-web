import { connectInfiniteHits } from 'react-instantsearch-dom';
import React from 'react'; // useEffect, useRef, useState,
import type { InfiniteHitsProvided } from 'react-instantsearch-core';
import { FaChevronDown, FaChevronUp } from 'react-icons/fa';
import { ExtendedClass } from '../../shared/apiTypes';
import { classNames, getClassId } from '../../shared/util';
import CourseCard from '../Course/CourseCard';
import { selectExpandCards, toggleExpand } from '../../src/features/semesterFormat';
import { useModal } from '../../src/features/modal';
import sampleCourses from './sampleCourses.json';
import { alertSignIn } from './searchUtils';
import { DAY_SHORT } from '../../shared/firestoreTypes';
import useChosenScheduleContext from '../../src/context/selectedSchedule';
import useSearchState from '../../src/context/searchState';
import { useAppDispatch, useAppSelector } from '../../src/hooks';

interface ButtonProps {
  onClick: () => void;
  enabled: boolean;
  direction: 'up' | 'down';
}

function CustomButton({
  onClick,
  enabled,
  direction,
}: ButtonProps) {
  const dispatch = useAppDispatch();
  const isExpanded = useAppSelector(selectExpandCards);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={onClick}
        disabled={!enabled}
        className={classNames(
          enabled
            ? 'bg-gray-800 hover:opacity-50'
            : 'bg-gray-300 cursor-not-allowed',
          'p-2 shadow w-24 sm:w-48 rounded text-white transition-opacity',
          'flex justify-center',
        )}
      >
        {direction === 'up' && <FaChevronUp />}
        {direction === 'down' && <FaChevronDown />}
      </button>
      <button
        type="button"
        onClick={() => dispatch(toggleExpand())}
        className={classNames(
          'bg-gray-800 text-white',
          'rounded-full interactive py-1 px-3 absolute inset-y-0 left-full ml-4',
          'flex items-center',
        )}
      >
        {isExpanded ? 'Collapse' : 'Expand'}
      </button>
    </div>
  );
}

export const HitsComponent: React.FC<
InfiniteHitsProvided<ExtendedClass> & { inSearch?: boolean }
> = function ({
  hits,
  hasPrevious,
  hasMore,
  refinePrevious,
  refineNext,
  inSearch = true,
}) {
  const { showCourse } = useModal();
  const { oneCol } = useSearchState();
  const { chosenScheduleId } = useChosenScheduleContext();

  return (
    <div className="space-y-6 flex flex-col items-center">
      <CustomButton
        enabled={hasPrevious}
        onClick={refinePrevious}
        direction="up"
      />

      {hits.length === 0 ? (
        // <div className="animate-pulse py-2 px-4 rounded-full bg-gray-300">
        //   Loading results...
        // </div>
        <span>No results found</span>
      ) : (
        <div className={oneCol ? 'flex flex-col space-y-2' : 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4'}>
          {hits.map((hit) => (
            <CourseCard
              key={getClassId(hit)}
              course={hit}
              chosenScheduleId={chosenScheduleId}
              handleExpand={() => showCourse(hit)}
              inSearchContext={inSearch}
            />
          ))}
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

export function HitsDemo() {
  return (
    <HitsComponent
      hits={sampleCourses
      // oh, the things i do for typescript
        .map((course) => ({
          ...course,
          ...Object.assign(
            {},
            ...DAY_SHORT.map((attr) => ({
              [attr]: course[attr] as 'Y' | 'N',
            })),
          ),
        }))}
      hasMore
      hasPrevious={false}
      refineNext={alertSignIn}
      refinePrevious={alertSignIn}
      inSearch={false}
    />
  );
}

export default connectInfiniteHits(HitsComponent);
