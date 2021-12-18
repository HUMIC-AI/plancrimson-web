import React from 'react';
import { FaAngleLeft, FaAngleRight } from 'react-icons/fa';
import { MyHarvardResponse } from '../src/types';
import { SearchParams } from './CategorySelect';
import Course from './Course';

type SearchResultsPayload = {
  data: MyHarvardResponse;
  search: string;
  pageNumber: number;
  totalPages: number;
};

export type SearchResults =
  | {
    status: 'none' | 'error';
    data?: string | object;
  }
  | ({ status: 'success' } & SearchResultsPayload)
  | ({ status: 'loading' } & Partial<SearchResultsPayload>); // when loading, the entries store the past data

const ResultsTab: React.FC<{
  searchResults: SearchResults;
  setSearchParams: React.Dispatch<React.SetStateAction<SearchParams | null>>;
}> = function ({
  searchResults, setSearchParams,
}) {
  return (
    <div>
      {searchResults.status === 'loading' && <p>Loading...</p>}

      {searchResults.status === 'error' && (
        <p>
          An error occurred fetching data:
          {' '}
          {searchResults.data}
        </p>
      )}

      {searchResults.status === 'success' && (
        <section>
          {' '}
          <div className="flex justify-between items-center mb-2">
            <h2 className="text-xl">
              Results
            </h2>
            {`${searchResults.data[2].HitCount} total`}
            <span className="flex items-center">
              {searchResults.pageNumber > 1 && (
              <button type="button" onClick={() => setSearchParams((prev) => ({ ...prev, search: searchResults.search, pageNumber: searchResults.pageNumber - 1 }))}>
                <FaAngleLeft />
              </button>
              )}
              <a
                href={`data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(searchResults.data[0].ResultsCollection))}`}
                download="courses.json"
              >
                Download
              </a>
              {searchResults.pageNumber < searchResults.totalPages && (
              <button type="button" onClick={() => setSearchParams((prev) => ({ ...prev, search: searchResults.search, pageNumber: searchResults.pageNumber + 1 }))}>
                <FaAngleRight />
              </button>
              )}
            </span>
          </div>

          <div className="space-y-4">
            {searchResults.data[0].ResultsCollection.map((course) => (
              <Course
                key={course.Key}
                course={course}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
};

export default ResultsTab;
