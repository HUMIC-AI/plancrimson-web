import { Tab } from '@headlessui/react';
import {
  QuerySnapshot,
  getDoc,
  onSnapshot, query, where,
} from 'firebase/firestore';
import { useEffect, useState } from 'react';
import type { ExtendedClass } from '@/src/lib';
import type { BaseSchedule } from '@/src/types';
import { Auth } from '@/src/features';
import { LoadingBars } from '@/components/Layout/LoadingPage';
import Schema from '@/src/schema';
import Link from 'next/link';
import { getDisplayName } from '@/src/utils/utils';
import { useFriends } from '@/components/ConnectPageComponents/friendUtils';

type Props = { course: ExtendedClass };

export default function SocialOuter({ course }: Props) {
  const userId = Auth.useAuthProperty('uid');

  if (!userId) {
    return <LoadingBars />;
  }

  return <SocialPanel course={course} userId={userId} />;
}

function SocialPanel({ course, userId }: Props & { userId: string }) {
  const [allSchedules, setAllSchedules] = useState<Record<string, BaseSchedule>>({});
  const [usernames, setUsernames] = useState<Record<string, string>>({});
  const { friends } = useFriends(userId);

  const updateSnap = (snap: QuerySnapshot<BaseSchedule>) => {
    const entries = snap.docs.map((doc) => [doc.id, doc.data()] as [string, BaseSchedule]);
    setAllSchedules((schedules) => ({ ...schedules, ...Object.fromEntries(entries) }));
  };

  useEffect(() => {
    const q = query(
      Schema.Collection.schedules(),
      where('ownerUid', '!=', userId),
      where('public', '==', true),
      where('classes', 'array-contains', course.id),
    );

    return onSnapshot(q, updateSnap, (err) => console.error(err));
  }, [course.id, userId]);

  useEffect(() => {
    if (!friends) return;
    const unsubs = friends.map((friend) => {
      const q = query(
        Schema.Collection.schedules(),
        where('ownerUid', '==', friend),
        where('classes', 'array-contains', course.id),
      );
      return onSnapshot(q, updateSnap, (err) => console.error(err));
    });
    return () => unsubs.forEach((unsub) => unsub());
  }, [course.id, friends]);

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
