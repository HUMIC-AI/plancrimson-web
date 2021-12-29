import { FaPlus } from 'react-icons/fa';
import { connectHits } from 'react-instantsearch-core';
import React from 'react';
import type { Class } from '../../shared/apiTypes';
import Highlight from './Highlight';

const Hits = connectHits<Class>(({ hits }) => (
  <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-4 gap-4">
    {hits.map((hit) => (
      <div className="bg-gray-300 rounded p-2 shadow relative">
        <h3 className="font-bold flex">
          <Highlight attribute="Title" hit={hit} />
          <FaPlus className="absolute top-2 right-2" />
        </h3>
        <p className="text-blue-700">
          <Highlight attribute="SUBJECT" hit={hit} />
          <Highlight attribute="CATALOG_NBR" hit={hit} />
        </p>
        <p className="text-sm line-clamp-3">
          <Highlight attribute="textDescription" hit={hit} />
        </p>
      </div>
    ))}
  </div>
));

export default Hits;
