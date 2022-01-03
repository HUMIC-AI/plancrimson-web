import React from 'react';
import type { StatsProvided } from 'react-instantsearch-core';
import { connectStats } from 'react-instantsearch-dom';

export const StatsComponent: React.FC<Pick<StatsProvided, 'nbHits' | 'processingTimeMS'>> = function ({
  nbHits, processingTimeMS,
}) {
  return (
    <div>
      <p className="min-w-max">
        Time:
        {' '}
        {processingTimeMS}
        {' '}
        ms
      </p>
      <p className="min-w-max">
        Results:
        {' '}
        {nbHits}
      </p>
    </div>
  );
};

export default connectStats(StatsComponent);