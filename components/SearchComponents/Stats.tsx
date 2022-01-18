import React from 'react';
import type { StatsProvided } from 'react-instantsearch-core';
import { connectStats } from 'react-instantsearch-dom';

type StatsProps = Pick<StatsProvided, 'nbHits' | 'processingTimeMS'>;

export const StatsComponent: React.FC<StatsProps> = function ({ nbHits, processingTimeMS }) {
  return (
    <div className="flex items-center space-x-2 flex-wrap">
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
