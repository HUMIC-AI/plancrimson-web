import { onSnapshot } from 'firebase/firestore';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import Layout, { errorMessages } from '../../components/Layout/Layout';
import { ErrorPage } from '../../components/Layout/ErrorPage';
import { LoadingPage } from '../../components/Layout/LoadingPage';
import Calendar from '../../components/SemesterSchedule/Calendar';
import { Schedule } from 'plancrimson-utils';
import Schema from 'plancrimson-utils';
import { ClassCache, Auth } from '@/src/features';
import { useAppDispatch, useElapsed } from '@/src/hooks';
import { useMeiliClient } from '@/src/meili';


export default function SchedulePage() {
  const userId = Auth.useAuthProperty('uid');
  const router = useRouter();
  const scheduleId = router.query.scheduleId as string;

  const { schedule, error } = useSchedule(userId, scheduleId);
  const elapsed = useElapsed(5000, [scheduleId]);

  if (typeof userId === 'undefined') {
    if (elapsed) return <LoadingPage />;
    return <Layout />;
  }

  if (userId === null) {
    return <ErrorPage>{errorMessages.unauthorized}</ErrorPage>;
  }

  if (!schedule || error) {
    return <ErrorPage>Schedule with that id not found.</ErrorPage>;
  }


  return (
    <Layout>
      <Calendar schedule={schedule} />
    </Layout>
  );
}


function useSchedule(userId: string | null | undefined, scheduleId: string) {
  const dispatch = useAppDispatch();
  const [schedule, setSchedule] = useState<Schedule | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { client } = useMeiliClient();

  useEffect(() => {
    const unsub = onSnapshot(Schema.schedule(scheduleId), (snap) => {
      if (snap.exists()) {
        const scheduleData = snap.data()!;
        setSchedule(scheduleData);
        const classIds = scheduleData.classes.map(({ classId }) => classId);
        if (client) dispatch(ClassCache.loadCourses(client, classIds));
      }
    }, (err) => setError(err.message));
    return unsub;
  }, [scheduleId, client]);

  return { schedule, error };
}
