import React from 'react';
import { FaAngleLeft, FaAngleRight } from 'react-icons/fa';
import { SearchParams, SearchResults } from './CategorySelect';
import Course from './Course';
import DownloadLink from './DownloadLink';

const ResultsTab: React.FC<{
  searchResults: SearchResults;
  setSearchParams: React.Dispatch<React.SetStateAction<SearchParams | null>>;
}> = function ({
  searchResults, setSearchParams,
}) {
  if (searchResults.error) {
    return (
      <p>
        An error occurred fetching data:
        {' '}
        {searchResults.error}
      </p>
    );
  }

  if (!searchResults.data) return <p>Loading...</p>;

  return (
    <div>
      <section>
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-xl">
            Results
          </h2>
          {`${searchResults.data[2].HitCount} total`}
          <span className="flex items-center">
            {searchResults.pageNumber > 1 && (
              <button
                type="button"
                onClick={() => setSearchParams((prev) => ({
                  ...prev,
                  search: searchResults.search,
                  pageNumber: searchResults.pageNumber - 1,
                }))}
              >
                <FaAngleLeft />
              </button>
            )}
            <DownloadLink obj={searchResults.data[0].ResultsCollection} filename="courses">
              Download
            </DownloadLink>
            {searchResults.pageNumber < searchResults.totalPages! && (
              <button
                type="button"
                onClick={() => setSearchParams((prev) => ({
                  ...prev,
                  search: searchResults.search,
                  pageNumber: searchResults.pageNumber + 1,
                }))}
              >
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
    </div>
  );
};

export default ResultsTab;
