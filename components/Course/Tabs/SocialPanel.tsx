import { Tab } from '@headlessui/react';
import {
  collection, getFirestore, onSnapshot, query, where,
} from 'firebase/firestore';
import { useEffect, useState } from 'react';
import type { ExtendedClass } from 'plancrimson-utils';
import { Schedule } from 'plancrimson-utils';

export default function SocialPanel({ course }: { course: ExtendedClass }) {
  const [publicSchedules, setPublicSchedules] = useState<Schedule[]>([]);

  useEffect(() => {
    const q = query(
      collection(getFirestore(), 'schedules'),
      where('public', '==', true),
      where('classes', 'array-contains', course.id),
    );
    const unsub = onSnapshot(q, (snap) => {
      setPublicSchedules(snap.docs.map((doc) => doc.data() as Schedule));
    }, (err) => console.error(err));
    return unsub;
  }, [course.id]);

  return (
    <Tab.Panel>
      <h1>Others taking this class</h1>
      {publicSchedules.length === 0 ? 'None' : (
        <ul>
          {publicSchedules.map((schedule) => (
            <li key={schedule.id}>
              {`${schedule.ownerUid} is considering this in ${schedule.season} ${schedule.year}`}
            </li>
          ))}
        </ul>
      )}
    </Tab.Panel>
  );
}
