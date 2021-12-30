/* eslint-disable jsx-a11y/anchor-is-valid */
import React, { useEffect, useState } from 'react';
import { ExtendedClass, SearchParams } from '../../shared/apiTypes';
import fetcher, { FetchError } from '../../shared/fetcher';
import { classNames } from '../../shared/util';
import DownloadLink from '../DownloadLink';

type DownloadStatus = {
  data?: ExtendedClass[];
  showDownload?: boolean;
  error?: string;
};

type Props = {
  searchParams: SearchParams,
  adminToken: string ;
  totalPages: number;
};

const AdminControls: React.FC<Props> = function ({ searchParams, adminToken, totalPages }) {
  const [batchStatus, setBatchStatus] = useState<null | 'loading' | 'done'>(null);
  const [doBatch, setDoBatch] = useState(true);
  const [batchSize, setBatchSize] = useState(50);
  const [force, setForce] = useState(false);

  // **pages** (not classes) of class information on my.harvard
  // are batched into groups of `BATCH_SIZE` pages
  // an administrator clicks through each batch at a time
  // the index of the batch the page is currently loading,
  // starting from zero
  const [batch, setBatch] = useState<number>(0);

  // keep track of the download status of each page
  const [requestStatuses, setRequestStatuses] = useState<Record<string, DownloadStatus>>({});

  const totalBatches = doBatch ? Math.ceil(totalPages / batchSize) : 1;

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

  async function fetchPage(pageNumber: number) {
    const data: SearchParams = {
      ...searchParams,
      pageNumber,
      includeEvals: true,
      updateDb: true,
    };
    try {
      const response = await fetcher({
        url: '/api/search',
        method: 'post',
        data,
        headers: {
          Authorization: `Bearer ${adminToken}`,
        },
      });
      if ('error' in response) {
        if (force) {
          await fetchPage(pageNumber);
        } else {
          setRequestStatus(pageNumber, {
            error: response.error,
          });
        }
      } else if (force) {
        await fetchPage(pageNumber);
      } else {
        setRequestStatus(pageNumber, { data: response.classes });
      }
    } catch (err) {
      if (force) {
        await fetchPage(pageNumber);
      } else {
      // originally the server would throw if it had trouble finding evaluations
      // but now this should rarely ever run
        const { message, info, status } = err as FetchError;
        const errInfo = JSON.stringify(info);
        setRequestStatus(pageNumber, {
          error: classNames(
            message,
            status >= 0 && (errInfo.length > 500 ? `${errInfo.slice(0, 500)}...` : errInfo),
          ),
        });
      }
    }
  }

  function loadBatch(startPage: number) {
    const promises: Promise<any>[] = [];
    const cap = doBatch ? Math.min(startPage + batchSize - 1, totalPages) : totalPages;

    setBatchStatus('loading');
    const initialRequestStatuses = {} as Record<string, DownloadStatus>;

    for (let pageNumber = startPage; pageNumber <= cap; pageNumber += 1) {
      initialRequestStatuses[pageNumber] = {};
      promises.push(fetchPage(pageNumber));
    }

    setRequestStatuses(initialRequestStatuses);

    Promise.allSettled(promises).then(() => {
      setBatchStatus('done');
      if (force && batch < totalBatches - 1) {
        loadBatch((batch + 1) * batchSize + 1);
        setBatch(batch + 1);
      }
    });
  }

  return (
    <div className="bg-gray-300 p-2 rounded">
      <h2 className="font-semibold text-lg">
        Admin controls
      </h2>

      {batchStatus === null ? (
        <>
          <label htmlFor="doBatch">
            <input type="checkbox" name="doBatch" id="doBatch" checked={doBatch} onChange={({ currentTarget }) => setDoBatch(currentTarget.checked)} />
            Batch search?
          </label>
          <label htmlFor="forceLoad">
            <input type="checkbox" name="forceLoad" id="forceLoad" checked={force} onChange={({ currentTarget }) => setForce(currentTarget.checked)} />
            Automatic load?
          </label>
          <input type="number" value={batchSize} onChange={({ currentTarget }) => setBatchSize(parseInt(currentTarget.value, 10))} />
          <button
            type="button"
            onClick={async () => {
              loadBatch(batch * batchSize + 1);
            }}
            className="bg-blue-300 hover:bg-blue-500 rounded py-2 px-3"
          >
            Admin: Download all
          </button>
        </>
      )
        : (
          <>
            <p>
              Loading batch
              {' '}
              {batch + 1}
              /
              {totalBatches}
            </p>
            <ul>
              {Object.entries(requestStatuses).map(([pageNumber, status]) => (
                <li key={pageNumber}>
                  Page
                  {' '}
                  {pageNumber}
                  :
                  {' '}
                  {!status.data && !status.error && 'Loading...'}

                  {status.data && (
                  <button
                    type="button"
                    onClick={() => setRequestStatus(parseInt(pageNumber, 10), {
                      ...status,
                      showDownload: true,
                    })}
                    className="text-green-500"
                  >
                    Success!
                  </button>
                  )}

                  {status.data && status.showDownload && (
                    <span>
                      {' '}
                      <DownloadLink obj={status.data} filename={`download-page-${pageNumber}`}>
                        Download data for
                        {' '}
                        {status.data.length}
                        {' '}
                        classes,
                        {' '}
                        {status.data.filter((cls) => cls.meanRating).length}
                        {' '}
                        with evaluations
                      </DownloadLink>
                    </span>
                  )}

                  {status.error && (
                  <span className="truncate w-full text-red-500">
                    <button
                      type="button"
                      onClick={() => {
                        setRequestStatus(parseInt(pageNumber, 10), {});
                        fetchPage(parseInt(pageNumber, 10));
                      }}
                      className="underline"
                    >
                      Retry
                    </button>
                    {' '}
                    {status.error}
                  </span>
                  )}
                </li>
              ))}
            </ul>
          </>
        )}

      {batchStatus === 'done' && (
        batch + 1 === totalBatches
          ? <p>Complete!</p>
          : (
            <p>
              Done!
              {' '}
              <button
                type="button"
                onClick={() => {
                  // load next batch
                  loadBatch((batch + 1) * batchSize + 1);
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
