import { useRouter } from 'next/router';
import { GraphPage } from '../../components/ExploreGraph/GraphPage';
import { ErrorMessage } from '../../components/Layout/ErrorMessage';
import Layout from '../../components/Layout/Layout';
import { useSchedule } from '../../src/utils/schedules';
import { LoadingBars } from '../../components/Layout/LoadingPage';
import { useElapsed } from '../../src/utils/hooks';

export default function ExploreSchedulePage() {
  const router = useRouter();
  const scheduleId = router.query.scheduleId as string;
  const elapsed = useElapsed(750, []);
  const { schedule, error } = useSchedule(scheduleId);

  if (error) {
    return (
      <Layout title="Explore Schedule">
        <ErrorMessage>Invalid schedule id.</ErrorMessage>
      </Layout>
    );
  }

  if (!elapsed || !schedule) {
    return (
      <Layout title="Explore Schedule">
        <LoadingBars />
      </Layout>
    );
  }

  return <GraphPage scheduleId={scheduleId} />;
}
