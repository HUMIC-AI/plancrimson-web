import { connectInfiniteHits } from 'react-instantsearch-dom';
import React, { useEffect, useState } from 'react';
import type { InfiniteHitsProvided } from 'react-instantsearch-core';
import {
  sampleCourses, ExtendedClass, getClassId,
} from '@/src/lib';
import CardExpandToggler from '@/components/YearSchedule/CardExpandToggler';
import useChosenScheduleContext from '@/src/context/selectedSchedule';
import useSearchState from '@/src/context/searchState';
import { alertSignIn } from './SearchBox/searchUtils';
import { CourseCard } from '../Course/CourseCard';
import useClientOrDemo from './ClientOrDemo';
import FadeTransition from '../Utils/FadeTransition';
import { MoreHitsButton } from './MoreHitsButton';

const sampleHits = sampleCourses as ExtendedClass[];

type Provided = InfiniteHitsProvided<ExtendedClass>;

// eslint-disable-next-line react/no-unused-prop-types
type Exposed = { inSearch?: boolean };

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
}: Provided & Exposed) {
  const { oneCol } = useSearchState();
  const { chosenScheduleId } = useChosenScheduleContext();

  return (
    <div className="flex flex-col items-center space-y-4">
      {/* <CustomButton
        enabled={hasPrevious}
        onClick={refinePrevious}
        direction="up"
      /> */}
      <CardExpandToggler />

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
              key={hit.id}
              course={hit}
              chosenScheduleId={chosenScheduleId}
              inSearchContext={inSearch}
            />
          ))}
        </div>
      )}

      <MoreHitsButton
        enabled={hasMore}
        onClick={refineNext}
        direction="down"
        // setNumCols={setNumCols}
      />
    </div>
  );
}


export default function Hits(props: Exposed) {
  const Component = useClientOrDemo<Provided, Exposed>(
    connectInfiniteHits,
    HitsComponent,
  );
  return <Component {...props} />;
}
