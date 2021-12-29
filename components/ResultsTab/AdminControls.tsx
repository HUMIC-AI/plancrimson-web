/* eslint-disable jsx-a11y/anchor-is-valid */
import React, { useEffect, useState } from 'react';
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import { ExtendedClass, SearchParams, SearchResults } from '../../shared/apiTypes';
import fetcher, { FetchError } from '../../shared/fetcher';
import DownloadLink from '../DownloadLink';

type DownloadStatus = {
  data?: ExtendedClass[];
  error?: string;
};

const BATCH_SIZE = 25;

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
  }) as Promise<SearchResults>;
}

type Props = {
  searchParams: SearchParams,
  adminToken: string ;
  totalPages: number;
};

const AdminControls: React.FC<Props> = function ({ searchParams, adminToken, totalPages }) {
  const [batchStatus, setBatchStatus] = useState<null | 'loading' | 'done'>(null);
  const [doBatch, setDoBatch] = useState(true);

  // **pages** (not classes) of class information on my.harvard
  // are batched into groups of `BATCH_SIZE` pages
  // an administrator clicks through each batch at a time
  // the index of the batch the page is currently loading,
  // starting from zero
  const [batch, setBatch] = useState<number>(0);

  // keep track of the download status of each page
  const [requestStatuses, setRequestStatuses] = useState<Record<string, DownloadStatus>>({});

  const totalBatches = doBatch ? Math.ceil(totalPages / BATCH_SIZE) : 1;

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
    const cap = doBatch ? Math.min(startPage + BATCH_SIZE - 1, totalPages) : totalPages;

    setBatchStatus('loading');
    const initialRequestStatuses = {} as Record<string, DownloadStatus>;

    for (let pageNumber = startPage; pageNumber <= cap; pageNumber += 1) {
      initialRequestStatuses[pageNumber] = {};
      const promise = fetchPage({
        searchParams,
        pageNumber,
        adminToken,
      }).then((response) => {
        console.log(response);
        if ('error' in response) {
          setRequestStatus(pageNumber, {
            error: response.error,
          });
        } else {
          setRequestStatus(pageNumber, { data: response.classes });
        }
      }).catch((err: FetchError) => {
        // originally the server would throw if it had trouble finding evaluations
        // but now this should rarely ever run
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
        <>
          <label htmlFor="doBatch">
            <input type="checkbox" name="doBatch" id="doBatch" checked={doBatch} onChange={({ currentTarget }) => setDoBatch(currentTarget.checked)} />
            Batch search?
          </label>
          <button
            type="button"
            onClick={async () => {
              loadBatch(batch * BATCH_SIZE + 1);
            }}
            className="bg-blue-300 rounded py-2 px-3"
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
                  <DownloadLink obj={status.data} filename={`download-page-${pageNumber}`}>
                    Success! Download data for
                    {' '}
                    {status.data.length}
                    {' '}
                    classes,
                    {' '}
                    {status.data.filter((cls) => cls.evals && cls.evals.length > 0).length}
                    {' '}
                    with evaluations
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
                  loadBatch((batch + 1) * BATCH_SIZE + 1);
                  setBatch(batch + 1);
                }}
              >
                Load next batch
              </button>
            </p>
          ))}

      <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
        <div className="flex-1 flex justify-between sm:hidden">
          <a
            href="#"
            className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
          >
            Previous
          </a>
          <a
            href="#"
            className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
          >
            Next
          </a>
        </div>
        <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-gray-700">
              Showing
              {' '}
              <span className="font-medium">1</span>
              {' '}
              to
              {' '}
              <span className="font-medium">10</span>
              {' '}
              of
              {' '}
              <span className="font-medium">97</span>
              {' '}
              results
            </p>
          </div>
          <div>
            <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
              <a
                href="#"
                className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
              >
                <span className="sr-only">Previous</span>
                <FaChevronLeft className="h-5 w-5" aria-hidden="true" />
              </a>
              {/* Current: "z-10 bg-indigo-50 border-indigo-500 text-indigo-600", Default: "bg-white border-gray-300 text-gray-500 hover:bg-gray-50" */}
              <a
                href="#"
                aria-current="page"
                className="z-10 bg-indigo-50 border-indigo-500 text-indigo-600 relative inline-flex items-center px-4 py-2 border text-sm font-medium"
              >
                1
              </a>
              <a
                href="#"
                className="bg-white border-gray-300 text-gray-500 hover:bg-gray-50 relative inline-flex items-center px-4 py-2 border text-sm font-medium"
              >
                2
              </a>
              <a
                href="#"
                className="bg-white border-gray-300 text-gray-500 hover:bg-gray-50 hidden md:inline-flex relative items-center px-4 py-2 border text-sm font-medium"
              >
                3
              </a>
              <span className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">
                ...
              </span>
              <a
                href="#"
                className="bg-white border-gray-300 text-gray-500 hover:bg-gray-50 hidden md:inline-flex relative items-center px-4 py-2 border text-sm font-medium"
              >
                8
              </a>
              <a
                href="#"
                className="bg-white border-gray-300 text-gray-500 hover:bg-gray-50 relative inline-flex items-center px-4 py-2 border text-sm font-medium"
              >
                9
              </a>
              <a
                href="#"
                className="bg-white border-gray-300 text-gray-500 hover:bg-gray-50 relative inline-flex items-center px-4 py-2 border text-sm font-medium"
              >
                10
              </a>
              <a
                href="#"
                className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
              >
                <span className="sr-only">Next</span>
                <FaChevronRight className="h-5 w-5" aria-hidden="true" />
              </a>
            </nav>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminControls;
