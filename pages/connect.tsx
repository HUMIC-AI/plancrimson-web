import { Tab } from '@headlessui/react';
import {
  getDocs, query, where,
} from 'firebase/firestore';
import Link from 'next/link';
import { useMemo } from 'react';
import useSWR from 'swr';
import Layout from '../components/Layout/Layout';
import { selectClassCache } from '../src/features/classCache';
import { selectSchedules } from '../src/features/schedules';
import { selectUserUid } from '../src/features/userData';
import { getFriendsCollectionGroup, useAppSelector } from '../src/hooks';

/**
 * just an async query instead of a snapshot listener
 * @returns a list of user ids that this user is friends with
 */
async function incomingRequests(uid: string) {
  const q = query(getFriendsCollectionGroup(), where('to', '==', uid));
  console.log(q);
  const friends = await getDocs(q);
  return friends.docs.map((doc) => doc.data());
}

function Friends() {
  const uid = useAppSelector(selectUserUid);
  const { data: friends, error } = useSWR(uid, incomingRequests);

  if (error) {
    console.error(error);
    return <pre>{JSON.stringify(error)}</pre>;
  }
  if (!friends) return <p>Loading...</p>;
  console.log(friends);
  const tabClass = ({ selected }: { selected: boolean }) => `${selected ? 'bg-blue-500' : 'bg-blue-300'} px-4 py-2 rounded`;
  return (
    <Tab.Group>
      <Tab.List>
        <Tab className={tabClass}>My friends</Tab>
        <Tab className={tabClass}>Incoming requests</Tab>
      </Tab.List>
      <Tab.Panels>
        <Tab.Panel>
          <ul>
            {friends.filter((request) => request.accepted).map((request) => (
              <li key={request.from + request.to}>
                {request.from}
              </li>
            ))}
          </ul>
        </Tab.Panel>
        <Tab.Panel>
          <ul>
            {friends.filter((request) => !request.accepted).map((request) => (
              <li key={request.from + request.to}>
                {request.from}
              </li>
            ))}
          </ul>
        </Tab.Panel>
      </Tab.Panels>
    </Tab.Group>
  );
}

export default function ConnectPage() {
  const schedules = useAppSelector(selectSchedules);
  const classCache = useAppSelector(selectClassCache);
  const constraints = useMemo(() => [where('public', '==', true)], []);

  return (
    <Layout title="Connect" scheduleQueryConstraints={constraints} size="space-y-12 pt-12">
      <h1>Connect with students with similar interests!</h1>
      <section>
        <Friends />
      </section>
      <section>
        <h2 className="text-3xl">Classmates</h2>
        <p>Find and connect with classmates!</p>
      </section>
      <section>
        <h2 className="text-3xl">Public schedules</h2>
        <ul className="mt-6">
          {Object.values(schedules).map((schedule) => (
            <li key={schedule.id} className="rounded-xl shadow-xl bg-blue-300 px-6 py-2">
              <div>
                <h3 className="text-xl">
                  {schedule.title}
                </h3>
                <p>
                  by
                  {' '}
                  <Link href={`/user/${schedule.ownerUid}`}>
                    <a>
                      {schedule.ownerUid}
                    </a>
                  </Link>
                </p>
              </div>
              <ul>
                {schedule.classes.map((classData) => classData.classId in classCache && (
                  <li key={classData.classId}>
                    {classCache[classData.classId].Title}
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      </section>
    </Layout>
  );
}
