import { connectInfiniteHits } from 'react-instantsearch-dom';
import React from 'react';
import type { InfiniteHitsProvided } from 'react-instantsearch-core';
import {
  sampleCourses, ExtendedClass,
} from '@/src/lib';
import CardExpandToggler from '@/components/YearSchedule/CardExpandToggler';
import useSearchState from '@/src/context/searchState';
import { alertSignIn } from './SearchBox/searchUtils';
import { CourseCard } from '../Course/CourseCard';
import useClientOrDemo from './ClientOrDemo';
import { MoreHitsButton } from './MoreHitsButton';
import { useElapsed } from '../../src/utils/hooks';

const sampleHits = sampleCourses as ExtendedClass[];

type Provided = InfiniteHitsProvided<ExtendedClass>;

/**
 * Renders hits returned by the search component
 */
function HitsComponent({
  hits = sampleHits,
  hasMore = true,
  // hasPrevious = false,
  refineNext = alertSignIn,
  // refinePrevious = alertSignIn,
}: Provided) {
  const { oneCol } = useSearchState();
  const elapsed = useElapsed(750, []);

  return (
    <div className="flex flex-col items-center space-y-4">
      {/* <CustomButton
        enabled={hasPrevious}
        onClick={refinePrevious}
        direction="up"
      /> */}
      <CardExpandToggler />

      {hits.length === 0 ? (
        elapsed
          ? <span>No results found. Try filtering by different properties.</span>
          : (
            <div className="animate-pulse rounded-full bg-gray-light px-4 py-2">
              Loading results...
            </div>
          )
      ) : (
        <div className={oneCol
          ? 'flex w-full flex-col items-stretch space-y-4'
          : 'grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4'}
        >
          {hits.map((hit) => (
            <CourseCard key={hit.id} course={hit} />
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


export default function Hits() {
  const Component = useClientOrDemo<Provided, {}>(
    connectInfiniteHits,
    HitsComponent,
  );
  return <Component />;
}
