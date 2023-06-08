import {
  DocumentSnapshot,
  QueryConstraint,
  getDocs,
  limit, orderBy, query, startAfter, where,
} from 'firebase/firestore';
import {
  useCallback, useEffect, useRef, useState,
} from 'react';
import Layout, { errorMessages } from '@/components/Layout/Layout';
import { ErrorPage } from '@/components/Layout/ErrorPage';
import { LoadingBars } from '@/components/Layout/LoadingPage';
import { Auth, ClassCache, Planner } from '@/src/features';
import { alertUnexpectedError, useAppDispatch, useElapsed } from '@/src/utils/hooks';
import Schema from '@/src/schema';
import { Schedule } from '@/src/types';
import { useMeiliClient } from '@/src/context/meili';
import { getAllClassIds } from '@/src/utils/schedules';
import { ScheduleList } from '@/components/SemesterSchedule/ScheduleList';

export const PAGE_SIZE = 5;

export default function () {
  const userId = Auth.useAuthProperty('uid');
  const elapsed = useElapsed(2000, []);

  // wait a little bit since otherwise the previous schedules will flicker
  const shortTimer = useElapsed(500, []);

  if (userId === null) {
    return (
      <ErrorPage>
        {errorMessages.unauthorized}
      </ErrorPage>
    );
  }

  if (typeof userId === 'undefined') {
    return (
      <Layout>
        {elapsed && <LoadingBars />}
      </Layout>
    );
  }

  if (!shortTimer) {
    return (
      <Layout className="mx-auto w-full max-w-xl">
        <LoadingBars />
      </Layout>
    );
  }

  return (
    <Layout title="Connect" className="mx-auto mt-6 max-w-3xl px-4" withMeili>
      <ConnectPage userId={userId} />
    </Layout>
  );
}

function ConnectPage({ userId }: { userId: string }) {
  const { client } = useMeiliClient();
  const dispatch = useAppDispatch();
  const targetRef = useRef<HTMLDivElement>(null);

  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [finalPoint, setFinalPoint] = useState<DocumentSnapshot<Schedule> | null>(null);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const loadMore = useCallback(() => {
    if (done || !client || loading) return;

    setLoading(true);

    scrollUntilSchedule(userId, finalPoint)
      .then(({ schedules: newSchedules, finalSchedule, done: isDone }) => {
        setSchedules((prev) => [...prev, ...newSchedules]);
        setFinalPoint(finalSchedule);
        setDone(isDone);
        return dispatch(ClassCache.loadCourses(client, getAllClassIds(newSchedules)));
      })
      .then(() => {
        setLoading(false);
      })
      .catch((err) => {
        alertUnexpectedError(err);
      });
  }, [client, done, finalPoint, loading, schedules.length, userId]);

  useEffect(() => {
    if (client) {
      loadMore();
      dispatch(Planner.setExpand('text'));
    }
  }, [client]);


  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        loadMore();
      }
    }, { threshold: 0.5 });

    if (targetRef.current) {
      observer.observe(targetRef.current);
    }

    return () => {
      observer.disconnect();
    };
  }, [loadMore]);

  if (schedules.length === 0) {
    return <p>Nobody has made a public schedule yet. Keep an eye out!</p>;
  }

  return (
    <>
      <ScheduleList schedules={schedules} className="grid grid-cols-1 sm:grid-cols-2" />
      <div ref={targetRef} />
    </>
  );
}

/**
 * Get the next PAGE_SIZE schedules after the given final point.
 */
function getSchedules(userId: string, finalPoint: DocumentSnapshot | null) {
  const constraints: QueryConstraint[] = [
    where('ownerUid', '!=', userId),
    orderBy('ownerUid'),
    limit(PAGE_SIZE),
  ];

  if (finalPoint !== null) {
    constraints.push(startAfter(finalPoint));
  }

  const q = query(Schema.Collection.schedules(), ...constraints);

  return getDocs(q);
}

async function scrollUntilSchedule(userId: string, initSchedule: DocumentSnapshot<Schedule> | null = null): Promise<{
  schedules: Schedule[];
  finalSchedule: DocumentSnapshot<Schedule> | null;
  done: boolean;
}> {
  const schedules = [];
  let finalSchedule = initSchedule;
  let done = false;

  while (schedules.length === 0) {
    const snap = await getSchedules(userId, finalSchedule);

    if (snap.docs.length === 0) {
      done = true;
      break;
    }

    const nonEmpty = snap.docs
      .map((doc) => doc.data())
      .filter((schedule) => schedule.classes.length > 0);

    schedules.push(...nonEmpty);

    finalSchedule = snap.docs[snap.docs.length - 1];
  }

  return { schedules, finalSchedule, done };
}
