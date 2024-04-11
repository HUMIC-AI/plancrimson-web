import { Tab } from '@headlessui/react';
import {
  QuerySnapshot,
  getDoc,
  onSnapshot, orderBy, query, where,
} from 'firebase/firestore';
import { useEffect, useState } from 'react';
import type { ExtendedClass } from '@/src/lib';
import type { BaseSchedule } from '@/src/types';
import { Auth } from '@/src/features';
import { LoadingBars } from '@/components/Layout/LoadingPage';
import Schema from '@/src/schema';
import Link from 'next/link';
import { getDisplayName } from '@/src/utils/utils';
import { useFriends, useIds } from '@/components/ConnectPageComponents/friendUtils';
import { useSharedCourses } from '@/src/utils/schedules';
import { useElapsed } from '@/src/utils/hooks';
import { MESSAGES } from '../../../src/utils/config';

type Props = { course: ExtendedClass };

export default function SocialOuter({ course }: Props) {
  const userId = Auth.useAuthProperty('uid');
  const elapsed = useElapsed(500, [userId]);

  if (userId === null) {
    return (
      <Tab.Panel>
        {MESSAGES.login}
      </Tab.Panel>
    );
  }

  if (typeof userId === 'undefined') {
    return (
      <Tab.Panel>
        {elapsed && <LoadingBars />}
      </Tab.Panel>
    );
  }

  return <SocialPanel course={course} userId={userId} />;
}

function SocialPanel({ course, userId }: Props & { userId: string }) {
  const [allSchedules, setAllSchedules] = useState<Record<string, BaseSchedule>>({});
  const [usernames, setUsernames] = useState<Record<string, string>>({});
  const { friends } = useFriends(userId);
  const friendIds = useIds(friends);

  const updateSnap = (snap: QuerySnapshot<BaseSchedule>) => {
    const entries = snap.docs.map((doc) => [doc.id, doc.data()] as [string, BaseSchedule]);
    setAllSchedules((schedules) => ({ ...schedules, ...Object.fromEntries(entries) }));
  };

  useEffect(() => {
    const q = query(
      Schema.Collection.schedules(),
      orderBy('ownerUid', 'asc'),
      where('ownerUid', '!=', userId),
      where('classes', 'array-contains', course.id),
    );

    return onSnapshot(q, updateSnap, (err) => console.error(err));
  }, [course.id, userId]);

  const sharedCourses = useSharedCourses(friendIds, course.id);

  useEffect(() => {
    const entries = Object.values(sharedCourses).flatMap((s) => s.map((c) => [c.id, c] as const));
    setAllSchedules((schedules) => ({
      ...schedules,
      ...Object.fromEntries(entries),
    }));
  }, [sharedCourses]);

  // get the profiles of the users
  useEffect(() => {
    const uids = Object.values(allSchedules)
      .map((schedule) => schedule.ownerUid)
      .filter((uid) => !usernames[uid]);

    if (uids.length === 0) {
      return;
    }

    const promises: Promise<readonly [string, string]>[] = [];
    new Set(uids).forEach((uid) => {
      const promise = getDoc(Schema.profile(uid))
        .then((doc) => {
          const username = getDisplayName(doc.data());
          return [uid, username] as const;
        });
      promises.push(promise);
    });

    Promise.all(promises)
      .then((entries) => {
        setUsernames((names) => ({ ...names, ...Object.fromEntries(entries) }));
      })
      .catch((err) => console.error(err));
  }, [allSchedules, usernames]);

  const schedules = Object.values(allSchedules);

  return (
    <Tab.Panel>
      <h2>Others taking this class</h2>
      {schedules.length === 0
        ? 'None'
        : (
          <ul>
            {schedules.map((schedule) => {
              const username = usernames[schedule.ownerUid];

              return (
                <li key={schedule.id}>
                  <Link href={`/user/${username}`} className="interactive">
                    {username}
                  </Link>
                  {` is considering this in ${schedule.season} ${schedule.year}`}
                </li>
              );
            })}
          </ul>
        )}
    </Tab.Panel>
  );
}

