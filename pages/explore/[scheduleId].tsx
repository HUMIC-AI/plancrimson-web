import { useRouter } from 'next/router';
import { GraphPage } from '../../components/ExploreGraph/GraphPage';
import { ErrorMessage } from '../../components/Layout/ErrorMessage';
import Layout from '../../components/Layout/Layout';

export default function ExploreSchedulePage() {
  const { query: { scheduleId } } = useRouter();

  if (typeof scheduleId !== 'string') {
    return (
      <Layout title="Explore Schedule">
        <ErrorMessage>Invalid schedule id.</ErrorMessage>
      </Layout>
    );
  }
  return <GraphPage scheduleId={scheduleId as string} />;
}
