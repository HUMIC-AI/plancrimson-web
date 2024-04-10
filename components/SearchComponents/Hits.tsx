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

  // keep track of all hits to animate them smoothly
  const [allHits, setAllHits] = useState<ExtendedClass[]>([]);

  useEffect(() => {
    // wait until transitions are over to unmount
    // merge existing hits with new ones by their ids
    // show new hits first
    setAllHits((hs) => [
      ...hits,
      ...hs.filter((h) => !hits.some((hit) => h.id === hit.id)),
    ]);
  }, [hits]);

  return (
    <div className="flex flex-col items-center space-y-4">
      {/* <CustomButton
        enabled={hasPrevious}
        onClick={refinePrevious}
        direction="up"
      /> */}
      <CardExpandToggler />

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
              <CourseCard
                course={hit}
                chosenScheduleId={chosenScheduleId}
                inSearchContext={inSearch}
              />
            </FadeTransition>
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
