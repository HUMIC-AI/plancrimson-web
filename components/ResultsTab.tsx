import React from 'react';
import { FaAngleLeft, FaAngleRight } from 'react-icons/fa';
import { SearchParams } from '../src/hooks';
import { MyHarvardResponse } from '../src/types';
import Course from './Course';
import DownloadLink from './DownloadLink';

const ResultsTab: React.FC<{
  searchResults: MyHarvardResponse;
  setSearchParams: React.Dispatch<React.SetStateAction<SearchParams>>;
}> = function ({
  searchResults, setSearchParams,
}) {
  const pageNumber = searchResults[2].PageNumber;
  return (
    <div>
      <section>
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-xl">
            Results
          </h2>
          {`${searchResults[2].HitCount} total`}
          <span className="flex items-center">
            {pageNumber > 1 && (
              <button
                type="button"
                onClick={() => setSearchParams((prev) => ({
                  ...prev,
                  pageNumber: pageNumber - 1,
                }))}
              >
                <FaAngleLeft />
              </button>
            )}
            <DownloadLink obj={searchResults[0].ResultsCollection} filename="courses">
              Download
            </DownloadLink>
            {pageNumber < searchResults[2].TotalPages! && (
              <button
                type="button"
                onClick={() => setSearchParams((prev) => ({
                  ...prev,
                  pageNumber: pageNumber + 1,
                }))}
              >
                <FaAngleRight />
              </button>
            )}
          </span>
        </div>

        <div className="space-y-4">
          {searchResults[0].ResultsCollection.map((course) => (
            <Course
              key={course.Key}
              course={course}
            />
          ))}
        </div>
      </section>
    </div>
  );
};

export default ResultsTab;
