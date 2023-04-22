import React from 'react';
import type { StatsProvided } from 'react-instantsearch-core';
import { connectStats } from 'react-instantsearch-dom';
import ClientOrDemo from './ClientOrDemo';

type StatsProps = Pick<StatsProvided, 'nbHits' | 'processingTimeMS'>;

function StatsComponent({ nbHits = 20000, processingTimeMS = 50 }: StatsProps) {
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
  return (
    <ClientOrDemo
      connector={connectStats}
      component={StatsComponent}
    />
  );
}
