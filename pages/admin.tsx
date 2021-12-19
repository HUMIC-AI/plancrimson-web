import axios from 'axios';
import {} from 'firebase/auth';
import { useState } from 'react';
import CategorySelect, { getFacets } from '../components/CategorySelect';
import DownloadLink from '../components/DownloadLink';
import Layout from '../components/Layout';
import ResultsTab from '../components/ResultsTab';
import { useSearch } from '../src/hooks';
import { useUser } from '../src/userContext';

const AdminPage: React.FC = function () {
  const { user } = useUser();
  const [filesResult, setFilesResult] = useState(null);
  const {
    searchParams, setSearchParams, searchResults, error,
  } = useSearch();

  const handleClick = async () => {
    if (!user) return;
    setFilesResult(null);
    const token = await user.getIdToken();
    const { data } = await axios.post('/api/allCourses', searchParams, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    setFilesResult(data);
  };

  return (
    <Layout title="Admin Page">
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={handleClick}
          className="px-4 py-2 bg-blue-300 hover:bg-blue-500 transition-colors"
        >
          Click me
        </button>
        <pre>
          {filesResult ? (
            <DownloadLink
              obj={filesResult}
              filename="result.json"
            >
              Files
            </DownloadLink>
          ) : 'No results yet'}
        </pre>
      </div>
      <div className="flex">
        <CategorySelect
          allFacets={searchResults ? getFacets(searchResults) : []}
          setSearchParams={setSearchParams}
          currentSearch={searchParams?.search}
        />
        <details>
          <summary className="border-2 border-gray-300 text-2xl rounded cursor-pointer py-2 px-3">Results</summary>
          {error && (
          <p>
            An error occurred fetching data:
            {' '}
            {error.message}
          </p>
          )}
          {searchResults && <ResultsTab searchResults={searchResults} setSearchParams={setSearchParams} />}
        </details>
      </div>
    </Layout>
  );
};

export default AdminPage;
