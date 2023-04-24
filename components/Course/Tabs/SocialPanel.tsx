import { Tab } from '@headlessui/react';
import {
  collection, getFirestore, onSnapshot, query, where,
} from 'firebase/firestore';
import { useEffect, useState } from 'react';
import type { ExtendedClass } from 'plancrimson-utils';
import type { Schedule } from '@/src/types';
import { useFriends } from '@/components/ConnectPageComponents/friendUtils';
import { Auth } from '@/src/features';
import { LoadingBars } from '@/components/Layout/LoadingPage';

type Props = { course: ExtendedClass };

export default function SocialOuter({ course }: Props) {
  const userId = Auth.useAuthProperty('uid');

  if (!userId) {
    return <LoadingBars />;
  }

  return <SocialPanel course={course} userId={userId} />;
}

function SocialPanel({ course, userId }: Props & { userId: string }) {
  const [otherUserSchedules, setPublicSchedules] = useState<Record<string, Schedule>>({});
  const { friends } = useFriends(userId);

  useEffect(() => {
    const collections = [];

    // get the public schedules
    collections.push(query(
      collection(getFirestore(), 'schedules'),
      where('public', '==', true),
      where('classes', 'array-contains', course.id),
    ));

    friends?.forEach((friend) => {
      collections.push(query(
        collection(getFirestore(), 'schedules'),
        where('ownerUid', '==', friend.id),
        where('classes', 'array-contains', course.id),
      ));
    });

    const dispose = collections.map((collection) => {
      const listener = onSnapshot(collection, (snap) => {
        const entries = snap.docs.map((doc) => [doc.id, doc.data()] as [string, Schedule]);
        setPublicSchedules((schedules) => ({ ...schedules, ...Object.fromEntries(entries) }));
      }, (err) => console.error(err));
      return listener;
    });

    return () => dispose.forEach((unsub) => unsub());
  }, [course.id, friends]);

  const schedules = Object.values(otherUserSchedules);

  return (
    <Tab.Panel>
      <h2>Others taking this class</h2>
      {schedules.length === 0
        ? 'None'
        : (
          <ul>
            {schedules.map((schedule) => (
              <li key={schedule.id}>
                {`${schedule.ownerUid} is considering this in ${schedule.season} ${schedule.year}`}
              </li>
            ))}
          </ul>
        )}
    </Tab.Panel>
  );
}
