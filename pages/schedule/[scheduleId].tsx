import { useRouter } from 'next/router';
import { useElapsed } from '@/src/utils/hooks';
import Layout from '@/components/Layout/Layout';
import Calendar from '@/components/SemesterSchedule/Calendar';
import { ErrorMessage } from '@/components/Layout/AuthWrapper';
import { useSchedule } from '@/src/utils/schedules';
import { useEffect } from 'react';
import { getAnalytics, logEvent } from 'firebase/analytics';

export default function SchedulePage() {
  return (
    <Layout title="Calendar" verify="meili" className="relative w-full max-w-screen-xl flex-1 bg-secondary xl:mx-auto">
      {({ userId }) => <Wrapper userId={userId} />}
    </Layout>
  );
}

function Wrapper({ userId }: { userId: string; }) {
  const router = useRouter();
  const scheduleId = router.query.scheduleId as string;
  const { schedule, error } = useSchedule(scheduleId);
  const elapsed = useElapsed(500, []);

  useEffect(() => {
    if (userId && schedule) {
      logEvent(getAnalytics(), 'page_view', {
        page_location: router.asPath,
        page_path: router.pathname,
        schedule,
      });
    }
  }, [schedule, router, userId]);

  if (error) {
    return <ErrorMessage>{error}</ErrorMessage>;
  }

  if (!schedule) {
    return elapsed ? <ErrorMessage>Could not find schedule</ErrorMessage> : null;
  }

  return <Calendar schedule={schedule} />;
}
