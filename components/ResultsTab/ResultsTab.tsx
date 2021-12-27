import React, { useEffect, useState } from 'react';
import { FaAngleLeft, FaAngleRight } from 'react-icons/fa';
import Course from './Course';
import DownloadLink from '../DownloadLink';
import ScheduleSelector from '../ScheduleSelector';
import { SearchParams, SearchResults } from '../../shared/apiTypes';
import useUser from '../../src/context/user';
import useUserData from '../../src/context/userData';
import { getClassId } from '../../src/util';
import AdminControls from './AdminControls';

const ResultsTab: React.FC<{
  searchParams: SearchParams;
  searchResults?: SearchResults;
  search: React.Dispatch<React.SetStateAction<SearchParams>>;
}> = function ({
  searchParams, searchResults, search: setSearchParams,
}) {
  const { user } = useUser();
  const { data } = useUserData();
  const [adminToken, setAdminToken] = useState<string | undefined>();
  const [selectedSchedule, selectSchedule] = useState<string | undefined>();

  useEffect(() => {
    user?.getIdTokenResult().then((token) => token.claims.admin && setAdminToken(token.token));
  }, [user]);

  if (Object.keys(searchParams).length === 0) {
    return <p>Search for a class to get started!</p>;
  }

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

      {adminToken && (
      <AdminControls
        searchParams={searchParams}
        adminToken={adminToken}
        totalPages={searchProperties.TotalPages}
      />
      )}

      <div className="flex justify-between items-center">
        <h2 className="text-xl">
          Results
        </h2>
        <p>
          {`${searchProperties.HitCount} total`}
          <br />
          {`Page ${searchProperties.PageNumber}/${searchProperties.TotalPages}`}
        </p>
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
