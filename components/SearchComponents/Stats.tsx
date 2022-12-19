import React from 'react';
import type { StatsProvided } from 'react-instantsearch-core';
import { connectStats } from 'react-instantsearch-dom';

type StatsProps = Pick<StatsProvided, 'nbHits' | 'processingTimeMS'>;

export const StatsComponent: React.FC<StatsProps> = function ({ nbHits, processingTimeMS }) {
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
        {nbHits}
      </p>
    </div>
  );
};

export default connectStats(StatsComponent);
