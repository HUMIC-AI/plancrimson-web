import React, { useEffect, useState } from 'react';
import { ExtendedClass, SearchParams } from '../../shared/apiTypes';
import fetcher, { FetchError } from '../../shared/fetcher';
import DownloadLink from '../DownloadLink';

type DownloadStatus = {
  data?: ExtendedClass[];
  error?: string;
};

const BATCH_SIZE = 100;

function fetchPage({ searchParams, pageNumber, adminToken }: {
  searchParams: SearchParams;
  pageNumber: number;
  adminToken: string;
}) {
  const data: SearchParams = {
    ...searchParams,
    pageNumber,
    includeEvals: true,
    updateDb: true,
  };
  return fetcher({
    url: '/api/search',
    method: 'post',
    data,
    headers: {
      Authorization: `Bearer ${adminToken}`,
    },
  }) as Promise<ExtendedClass[]>;
}

type Props = {
  searchParams: SearchParams,
  adminToken: string ;
  totalPages: number;
};

const AdminControls: React.FC<Props> = function ({ searchParams, adminToken, totalPages }) {
  const [batchStatus, setBatchStatus] = useState<null | 'loading' | 'done'>(null);
  const [batch, setBatch] = useState<number>(0);
  const [requestStatuses, setRequestStatuses] = useState<Record<string, DownloadStatus>>({});

  const totalBatches = Math.ceil(totalPages / BATCH_SIZE);

  const setRequestStatus = (pageNumber: number, value: DownloadStatus) => {
    setRequestStatuses((prev) => ({
      ...prev,
      [pageNumber]: value,
    }));
  };

  // reset the current queries whenever the user changes the search parameters
  useEffect(() => {
    setBatchStatus(null);
    setRequestStatuses({});
  }, [searchParams]);

  function loadBatch(startPage: number) {
    const promises: Promise<any>[] = [];
    const cap = Math.min(startPage + BATCH_SIZE - 1, totalPages);

    setBatchStatus('loading');
    const initialRequestStatuses = {} as Record<string, DownloadStatus>;

    for (let pageNumber = startPage; pageNumber <= cap; pageNumber += 1) {
      initialRequestStatuses[pageNumber] = {};
      const promise = fetchPage({
        searchParams,
        pageNumber,
        adminToken,
      }).then((classes) => {
        setRequestStatus(pageNumber, { data: classes });
      }).catch((err: FetchError) => {
        setRequestStatus(pageNumber, {
          error: `${err.message} ${JSON.stringify(err.info)}`,
        });
      });
      promises.push(promise);
    }

    setRequestStatuses(initialRequestStatuses);

    Promise.allSettled(promises).then(() => {
      setBatchStatus('done');
    });
  }

  return (
    <div className="bg-gray-300 p-2 rounded">
      <h2 className="font-semibold text-lg">
        Admin controls
      </h2>

      {batchStatus === null ? (
        <button
          type="button"
          onClick={async () => {
            loadBatch(batch * BATCH_SIZE + 1);
          }}
          className="bg-blue-300 rounded py-2 px-3"
        >
          Admin: Download all
        </button>
      )
        : (
          <>
            <p>
              Loading batch
              {' '}
              {batch}
              /
              {totalBatches}
            </p>
            <ul>
              {Object.entries(requestStatuses).map(([taskNumber, status]) => (
                <li key={taskNumber}>
                  {taskNumber}
                  :
                  {' '}
                  {!status.data && !status.error && 'Loading...'}

                  {status.data && (
                  <DownloadLink obj={status.data} filename={`download${taskNumber}`}>
                    Success! Download
                  </DownloadLink>
                  )}

                  {status.error && (
                  <span className="truncate w-full text-red-500">
                    {status.error}
                  </span>
                  )}
                </li>
              ))}
            </ul>
          </>
        )}

      {batchStatus === 'done' && (
        batch === totalBatches
          ? <p>Complete!</p>
          : (
            <p>
              Done!
              {' '}
              <button
                type="button"
                onClick={() => {
                  loadBatch((batch + 1) * BATCH_SIZE + 1);
                  setBatch(batch + 1);
                }}
              >
                Load next batch
              </button>
            </p>
          ))}
    </div>
  );
};

export default AdminControls;
