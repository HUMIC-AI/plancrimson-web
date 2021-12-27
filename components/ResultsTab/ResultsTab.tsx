import React, { useEffect, useState } from 'react';
import { FaAngleLeft, FaAngleRight } from 'react-icons/fa';
import Course from './Course';
import DownloadLink from '../DownloadLink';
import ScheduleSelector from '../ScheduleSelector';
import fetcher, { FetchError } from '../../shared/fetcher';
import { ExtendedClass, SearchParams, SearchResults } from '../../shared/apiTypes';
import useUser from '../../src/context/user';
import useUserData from '../../src/context/userData';
import { getClassId } from '../../src/util';

type DownloadStatus = {
  status: 'loading' | 'success' | 'error';
  data?: ExtendedClass[];
  error?: string;
};

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
  const [queries, setQueries] = useState<Record<string, DownloadStatus>>({});
  const [selectedSchedule, selectSchedule] = useState<string | undefined>();

  useEffect(() => {
    user?.getIdTokenResult().then((token) => token.claims.admin && setAdminToken(token.token));
  }, [user]);

  useEffect(() => {
    setQueries({});
  }, [searchParams]);

  if (Object.keys(searchParams).length === 0) {
    return <p>Search for a class to get started!</p>;
  }

  if (!searchResults) {
    return <p>Loading...</p>;
  }

  const { classes, searchProperties } = searchResults;
  const pageNumber = searchProperties.PageNumber;

  const handleDownload = () => {
    setQueries({});
    [...new Array(searchProperties.TotalPages)].forEach(async (_, i) => {
      const taskNumber = i + 1;
      try {
        setQueries((prev) => ({
          ...prev,
          [taskNumber]: {
            status: 'loading',
          },
        }));
        const results = await fetcher({
          url: '/api/search',
          method: 'post',
          data: {
            ...searchParams, pageNumber: taskNumber, includeEvals: true, updateDb: true,
          } as SearchParams,
          headers: {
            Authorization: `Bearer ${adminToken}`,
          },
        });
        setQueries((prev) => ({
          ...prev,
          [taskNumber]: {
            status: 'success',
            data: results,
          },
        }));
      } catch (err) {
        const { message, info } = err as FetchError;
        setQueries((prev) => ({
          ...prev,
          [taskNumber]: {
            status: 'error',
            error: `${message} ${JSON.stringify(info)}`,
          },
        }));
      }
    });
  };

  return (
    <div className="space-y-2 mt-2">
      <ScheduleSelector
        schedules={Object.keys(data.schedules)}
        selectSchedule={selectSchedule}
        selectedSchedule={selectedSchedule}
      />

      {adminToken && (
      <div className="bg-gray-300 p-2 rounded">
        <h2 className="font-semibold">Admin controls</h2>
        <button
          type="button"
          onClick={handleDownload}
          className="bg-blue-300 rounded py-2 px-3"
        >
          Download all
        </button>
        <ul>
          {Object.entries(queries).map(([taskNumber, status]) => (
            <li key={taskNumber}>
              {taskNumber}
              :
              {' '}
              {status.status === 'success'
                && (
                  <DownloadLink obj={status.data} filename={`download${taskNumber}`}>
                    Success! Download
                  </DownloadLink>
                )}
              {status.status === 'error' && (
              <span className="truncate text-red-500">
                {status.error}
              </span>
              )}
            </li>
          ))}
        </ul>
      </div>
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
