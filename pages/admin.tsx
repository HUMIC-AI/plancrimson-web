import axios from 'axios';
import {} from 'firebase/auth';
import { useState } from 'react';
import { useUser } from '../src/userContext';

const AdminPage: React.FC = function () {
  const { user } = useUser();
  const [results, setResults] = useState<any>();

  const handleClick = async () => {
    if (!user) return;

    const token = await user.getIdToken();

    const { data } = await axios.post('/api/admin', {
      search: '(ACAD_ORG:CS)',
    }, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    setResults(data);

    console.log(data);
  };
  return (
    <div>
      <button type="button" onClick={handleClick} className="px-4 py-2 bg-blue-300 hover:bg-blue-500 transition-colors">Click me</button>
      <pre>{JSON.stringify(results, null, 2)}</pre>
    </div>
  );
};

export default AdminPage;
