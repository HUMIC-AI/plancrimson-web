import axios from 'axios';
import {} from 'firebase/auth';
import { useState } from 'react';
import CategorySelect, { getFacets, useSearch } from '../components/CategorySelect';
import DownloadLink from '../components/DownloadLink';
import ResultsTab from '../components/ResultsTab';
import { useUser } from '../src/userContext';

const AdminPage: React.FC = function () {
  const { user } = useUser();
  const [filesResult, setFilesResult] = useState(null);
  const {
    searchParams, setSearchParams, searchResults,
  } = useSearch({ searchOnChange: true });

  const handleClick = async () => {
    if (!user) return;

    console.log(searchParams);

    setFilesResult(null);

    const token = await user.getIdToken();

    const { data } = await axios.post('/api/allCourses', searchParams, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    setFilesResult(data);

    console.log(data);
  };

  return (
    <div>
      <button type="button" onClick={handleClick} className="px-4 py-2 bg-blue-300 hover:bg-blue-500 transition-colors">Click me</button>
      <CategorySelect
        allFacets={getFacets(searchResults)}
        setSearchParams={setSearchParams}
        currentSearch={searchParams?.search}
      />
      <details>
        <summary>Results</summary>
        <ResultsTab searchResults={searchResults} setSearchParams={setSearchParams} />
      </details>
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
  );
};

export default AdminPage;
