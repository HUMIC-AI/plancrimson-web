import { connectInfiniteHits } from 'react-instantsearch-dom';
import React from 'react';
import type { InfiniteHitsProvided } from 'react-instantsearch-core';
import { FaChevronDown, FaChevronUp } from 'react-icons/fa';
import {
  sampleCourses, ExtendedClass, DAY_SHORT, getClassId,
} from '@/src/lib';
import CardExpandToggler from '@/components/YearSchedule/CardExpandToggler';
import useChosenScheduleContext from '@/src/context/selectedSchedule';
import useSearchState from '@/src/context/searchState';
import { classNames } from '@/src/utils/styles';
import { alertSignIn } from './SearchBox/searchUtils';
import CourseCard from '../Course/CourseCard';
import ClientOrDemo from './ClientOrDemo';

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
  return (
    <div className="relative">
      <button
        type="button"
        onClick={onClick}
        disabled={!enabled}
        className={classNames(
          enabled
            ? 'hover:opacity-50'
            : 'cursor-not-allowed',
          'p-2 bg-gray-secondary shadow w-24 sm:w-48 rounded transition-opacity',
          'flex justify-center',
        )}
      >
        {direction === 'up' && <FaChevronUp />}
        {direction === 'down' && <FaChevronDown />}
      </button>
      <div className="absolute left-full top-1/2 ml-2 -translate-y-1/2">
        <CardExpandToggler />
      </div>
    </div>
  );
}

const sampleHits = sampleCourses
  // oh, the things i do for typescript
  .map((course) => ({
    ...course,
    ...Object.assign(
      {},
      ...DAY_SHORT.map((attr) => ({
        [attr]: course[attr] as 'Y' | 'N',
      })),
    ),
  }));

function HitsComponent({
  hits = sampleHits,
  hasMore = true,
  hasPrevious = false,
  refineNext = alertSignIn,
  refinePrevious = alertSignIn,
  inSearch = false,
}: InfiniteHitsProvided<ExtendedClass> & { inSearch?: boolean }) {
  const { oneCol } = useSearchState();
  const { chosenScheduleId } = useChosenScheduleContext();

  return (
    <div className="flex flex-col items-center space-y-6">
      <CustomButton
        enabled={hasPrevious}
        onClick={refinePrevious}
        direction="up"
      />

      {hits.length === 0 ? (
        // <div className="animate-pulse py-2 px-4 rounded-full bg-gray-light">
        //   Loading results...
        // </div>
        <span>No results found</span>
      ) : (
        <div className={oneCol
          ? 'flex w-full flex-col items-stretch space-y-4'
          : 'grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4'}
        >
          {hits.map((hit) => (
            <CourseCard
              key={getClassId(hit)}
              course={hit}
              chosenScheduleId={chosenScheduleId}
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
}

export default function () {
  return (
    <ClientOrDemo
      connector={connectInfiniteHits}
      component={HitsComponent}
    />
  );
}
