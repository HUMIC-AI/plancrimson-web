import { useRouter } from 'next/router';
import { GraphPage } from '../../components/ExploreGraph/GraphPage';
import { ErrorMessage } from '../../components/Layout/ErrorMessage';
import Layout from '../../components/Layout/Layout';

export default function ExploreSchedulePage() {
  const { query: { scheduleId } } = useRouter();

  if (!scheduleId || typeof scheduleId !== 'string') {
    return (
      <Layout title="Explore Schedule">
        {scheduleId && <ErrorMessage>Invalid schedule id.</ErrorMessage>}
      </Layout>
    );
  }

  return <GraphPage scheduleId={scheduleId} />;
}
