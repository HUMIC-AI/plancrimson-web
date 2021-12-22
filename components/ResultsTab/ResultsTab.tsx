import React from 'react';
import { FaAngleLeft, FaAngleRight } from 'react-icons/fa';
import { SearchParams, SearchResults } from '../../src/types';
import Course from './Course';
import DownloadLink from '../DownloadLink';
import { getClassId, useUserData } from '../../src/userContext';
import ScheduleSelector, { ScheduleSelectorProps } from '../ScheduleSelector';

const ResultsTab: React.FC<{
  searchResults?: SearchResults;
  search: React.Dispatch<React.SetStateAction<SearchParams>>;
} & ScheduleSelectorProps> = function ({
  searchResults, search: setSearchParams, selectSchedule, selectedSchedule,
}) {
  const { data } = useUserData();
  if (!searchResults) {
    return <p>Loading...</p>;
  }

  const { classes, searchProperties } = searchResults;
  const pageNumber = searchProperties.PageNumber;
  return (
    <div className="space-y-2 mt-2">
      <ScheduleSelector
        schedules={Object.keys(data.schedules)}
        selectSchedule={selectSchedule}
        selectedSchedule={selectedSchedule}
      />

      <div className="flex justify-between items-center">
        <h2 className="text-xl">
          Results
        </h2>
        {`${searchProperties.HitCount} total`}
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
          <DownloadLink obj={classes} filename="courses">
            Download
          </DownloadLink>
          {pageNumber < searchProperties.TotalPages && (
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
        {classes.map((course) => (
          <Course
            key={getClassId(course)}
            course={course}
            schedule={selectedSchedule ? data.schedules[selectedSchedule] : undefined}
          />
        ))}
      </div>
    </div>
  );
};

export default ResultsTab;
