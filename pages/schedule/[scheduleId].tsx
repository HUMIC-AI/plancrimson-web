import { onSnapshot } from 'firebase/firestore';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { ClassCache, Auth } from '@/src/features';
import { useAppDispatch, useElapsed } from '@/src/utils/hooks';
import { useMeiliClient } from '@/src/context/meili';
import Firestore from '@/src/schema';
import Layout, { errorMessages } from '@/components/Layout/Layout';
import { ErrorPage } from '@/components/Layout/ErrorPage';
import { LoadingBars } from '@/components/Layout/LoadingPage';
import Calendar from '@/components/SemesterSchedule/Calendar';
import { BaseSchedule } from '@/src/types';

export default function SchedulePage() {
  const userId = Auth.useAuthProperty('uid');
  const router = useRouter();
  const scheduleId = router.query.scheduleId as string;

  const { schedule, error } = useSchedule(scheduleId);
  const elapsed = useElapsed(5000, [scheduleId]);

  if (error) {
    return <ErrorPage>{error}</ErrorPage>;
  }

  if (userId === null) {
    return <ErrorPage>{errorMessages.unauthorized}</ErrorPage>;
  }

  if (typeof userId === 'undefined' || !schedule) {
    return (
      <Layout>
        {elapsed && <LoadingBars />}
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="border-black shadow-lg sm:rounded-lg sm:border-4">
        <Calendar schedule={schedule} />
      </div>
    </Layout>
  );
}


function useSchedule(scheduleId: string) {
  const dispatch = useAppDispatch();
  const [schedule, setSchedule] = useState<BaseSchedule | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { client } = useMeiliClient();

  useEffect(() => {
    if (!scheduleId) return;

    const unsub = onSnapshot(Firestore.schedule(scheduleId), (snap) => {
      if (snap.exists()) {
        const scheduleData = snap.data()!;
        setSchedule(scheduleData);
        if (client) dispatch(ClassCache.loadCourses(client, scheduleData.classes));
      }
    }, (err) => setError(err.message));
    return unsub;
  }, [scheduleId, client]);

  return { schedule, error };
}
