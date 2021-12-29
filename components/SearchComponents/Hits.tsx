import { FaPlus } from 'react-icons/fa';
import { connectHits } from 'react-instantsearch-core';
import React from 'react';
import type { Class } from '../../shared/apiTypes';
import Highlight from './Highlight';
import useUserData from '../../src/context/userData';
import { getClassId } from '../../src/util';
import useSearchPageContext from '../../src/context/searchPage';

const Hits = connectHits<Class>(({ hits }) => {
  const { addCourses } = useUserData();
  const { selectedSchedule } = useSearchPageContext();
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-4 gap-4">
      {hits.map((hit) => (
        <div key={getClassId(hit)} className="bg-gray-300 rounded p-2 shadow relative">
          <h3 className="font-bold flex">
            <Highlight attribute="Title" hit={hit} />
            {selectedSchedule && (
            <button
              type="button"
              onClick={() => {
                const data = { classId: getClassId(hit), scheduleId: selectedSchedule };
                console.log({ data, hit });
                addCourses(data);
              }}
            >
              <FaPlus className="absolute top-2 right-2" />
            </button>
            )}
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
  );
});

export default Hits;
