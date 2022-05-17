import { where } from 'firebase/firestore';
import { useMemo } from 'react';
import Layout from '../components/Layout/Layout';
import { selectSchedules } from '../src/features/schedules';
import { useAppSelector } from '../src/hooks';

export default function ConnectPage() {
  const schedules = useAppSelector(selectSchedules);
  const constraints = useMemo(() => [where('public', '==', true)], []);
  return (
    <Layout title="Connect" queryConstraints={constraints}>
      <h1>Connect with students with similar interests!</h1>
      <pre>
        {JSON.stringify(schedules, null, 2)}
      </pre>
    </Layout>
  );
}
