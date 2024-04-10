import React from 'react';
import type { StatsProvided } from 'react-instantsearch-core';
import { connectStats } from 'react-instantsearch-dom';
import useClientOrDemo from './ClientOrDemo';

type Provided = Pick<StatsProvided, 'nbHits' | 'processingTimeMS'>;

function StatsComponent({ nbHits = 20000, processingTimeMS = 50 }: Provided) {
  return (
    <div className="flex flex-wrap items-center space-x-2">
      <p className="whitespace-nowrap">
        Time:
        {' '}
        {processingTimeMS}
        ms
      </p>
      <p className="whitespace-nowrap">
        Results:
        {' '}
        {nbHits}
      </p>
    </div>
  );
}

export default function () {
  const Component = useClientOrDemo<Provided, {}>(
    connectStats,
    StatsComponent,
  );
  return <Component {...{}} />;
}
