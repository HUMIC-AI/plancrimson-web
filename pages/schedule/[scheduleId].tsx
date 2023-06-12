import { useRouter } from 'next/router';
import { useElapsed } from '@/src/utils/hooks';
import Layout from '@/components/Layout/Layout';
import Calendar from '@/components/SemesterSchedule/Calendar';
import { ErrorMessage } from '@/components/Layout/AuthWrapper';
import { useSchedule } from '@/src/utils/schedules';

export default function SchedulePage() {
  return (
    <Layout title="Calendar" verify="meili">
      {() => <Wrapper />}
    </Layout>
  );
}

function Wrapper() {
  const router = useRouter();
  const scheduleId = router.query.scheduleId as string;
  const { schedule, error } = useSchedule(scheduleId);
  const elapsed = useElapsed(500, []);

  if (error) {
    return <ErrorMessage>{error}</ErrorMessage>;
  }

  if (!schedule) {
    return elapsed ? <ErrorMessage>Could not find schedule</ErrorMessage> : null;
  }

  return <Calendar schedule={schedule} />;
}
