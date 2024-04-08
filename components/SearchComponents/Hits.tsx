import { connectInfiniteHits } from 'react-instantsearch-dom';
import React, { useEffect, useState } from 'react';
import type { InfiniteHitsProvided } from 'react-instantsearch-core';
import { FaChevronDown, FaChevronUp } from 'react-icons/fa';
import {
  sampleCourses, ExtendedClass, getClassId,
} from '@/src/lib';
import CardExpandToggler from '@/components/YearSchedule/CardExpandToggler';
import useChosenScheduleContext from '@/src/context/selectedSchedule';
import useSearchState from '@/src/context/searchState';
import { classNames } from '@/src/utils/styles';
import { alertSignIn } from './SearchBox/searchUtils';
import CourseCard from '../Course/CourseCard';
import ClientOrDemo from './ClientOrDemo';
import FadeTransition from '../Utils/FadeTransition';

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

const sampleHits = sampleCourses as ExtendedClass[];

/**
 * TODO optimize this component
 * Since number of hits is pretty small so efficiency is fine
 * but this is very inefficient
 */
function HitsComponent({
  hits = sampleHits,
  hasMore = true,
  // hasPrevious = false,
  refineNext = alertSignIn,
  // refinePrevious = alertSignIn,
  inSearch = false,
}: InfiniteHitsProvided<ExtendedClass> & { inSearch?: boolean }) {
  const { oneCol } = useSearchState();
  const { chosenScheduleId } = useChosenScheduleContext();

  // keep track of all hits to animate them smoothly
  const [allHits, setAllHits] = useState<ExtendedClass[]>([]);

  useEffect(() => {
    // wait until transitions are over to unmount
    // merge existing hits with new ones by their ids
    setAllHits((hs) => {
      const newHits = hits.filter((hit) => !hs.some((h) => h.id === hit.id));
      return [...hs, ...newHits];
    });
  }, [hits]);

  return (
    <div className="flex flex-col items-center space-y-6">
      {/* <CustomButton
        enabled={hasPrevious}
        onClick={refinePrevious}
        direction="up"
      /> */}

      {allHits.length === 0 ? (
        // <div className="animate-pulse py-2 px-4 rounded-full bg-gray-light">
        //   Loading results...
        // </div>
        <span>No results found</span>
      ) : (
        <div className={oneCol
          ? 'flex w-full flex-col items-stretch space-y-4'
          : 'grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4'}
        >
          {allHits.map((hit) => (
            <FadeTransition
              show={hits.some((h) => h.id === hit.id)}
              appear
              key={getClassId(hit)}
              afterLeave={() => setAllHits((hs) => hs.filter((h) => h.id !== hit.id))}
            >
              <div>
                <CourseCard
                  course={hit}
                  chosenScheduleId={chosenScheduleId}
                  inSearchContext={inSearch}
                />
              </div>
            </FadeTransition>
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
      Component={HitsComponent}
    />
  );
}
