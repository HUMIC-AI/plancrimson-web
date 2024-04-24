import { connectInfiniteHits } from 'react-instantsearch-dom';
import React from 'react';
import type { InfiniteHitsProvided } from 'react-instantsearch-core';
import {
  sampleCourses, ExtendedClass,
} from '@/src/lib';
import CardExpandToggler from '@/components/YearSchedule/CardExpandToggler';
import useSearchState from '@/src/context/searchState';
import { FaChevronUp, FaChevronDown } from 'react-icons/fa';
import { alertSignIn } from './SearchBox/searchUtils';
import { CourseCard } from '../Course/CourseCard';
import useClientOrDemo from './ClientOrDemo';
import { useElapsed } from '../../src/utils/hooks';
import { useCourseCardStyle } from '../../src/context/CourseCardStyleProvider';
import { classNames } from '../../src/utils/styles';
import { LoadingText } from '../Layout/LoadingPage';

const sampleHits = sampleCourses as ExtendedClass[];

type Provided = InfiniteHitsProvided<ExtendedClass>;

type Exposed = {
  concise?: boolean;
  hideToggle?: boolean;
};

/**
 * Renders hits returned by the search component
 */
function HitsComponent({
  hits = sampleHits,
  hasMore = true,
  // hasPrevious = false,
  refineNext = alertSignIn,
  // refinePrevious = alertSignIn,
  concise,
  hideToggle,
}: Provided & Exposed) {
  const { oneCol } = useSearchState();
  const { style } = useCourseCardStyle();
  const elapsed = useElapsed(750, []);

  return (
    <div className="flex flex-col items-center space-y-4">
      {/* <CustomButton
        enabled={hasPrevious}
        onClick={refinePrevious}
        direction="up"
      /> */}
      {!concise && <CardExpandToggler />}

      {hits.length === 0 ? (
        elapsed
          ? <span>No results found. Try filtering by different properties.</span>
          : <LoadingText />
      ) : (
        <div className={classNames(
          oneCol
            ? 'flex w-full flex-col items-stretch'
            : 'grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4',
          oneCol && (style === 'text' ? 'space-y-1' : 'space-y-4'),
        )}
        >
          {hits.map((hit) => (
            <CourseCard
              key={hit.id}
              course={hit}
              hideRatings={concise}
              clickWholeCard={hideToggle}
            />
          ))}
        </div>
      )}

      <MoreHitsButton
        enabled={hasMore}
        onClick={refineNext}
        direction="down"
        concise={concise}
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

interface ButtonProps {
  onClick: () => void;
  enabled: boolean;
  direction: 'up' | 'down';
  concise?: boolean;
}

function MoreHitsButton({
  onClick, enabled, direction, concise,
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

      {!concise && (
      <div className="absolute left-full top-1/2 ml-2 -translate-y-1/2">
        <CardExpandToggler />
      </div>
      )}
    </div>
  );
}
