import { Tab } from '@headlessui/react';
import {
  DocumentSnapshot,
  getDoc,
  getDocs, query, where,
} from 'firebase/firestore';
import Image from 'next/image';
import Link from 'next/link';
import { useMemo } from 'react';
import useSWR from 'swr';
import Layout, { LoadingPage, UnauthorizedPage } from '../components/Layout/Layout';
import { UserProfile } from '../shared/firestoreTypes';
import { allTruthy } from '../shared/util';
import { Auth, ClassCache, Schedules } from '../src/features';
import { Schema, useAppSelector, useElapsed } from '../src/hooks';

/**
 * just an async query instead of a snapshot listener
 * @returns a list of user ids that this user is friends with
 */
async function fetchFriendRequests(uid: string) {
  const incomingQ = query(Schema.Collection.allFriends(), where('to', '==', uid));
  const outgoingQ = query(Schema.Collection.allFriends(), where('from', '==', uid));
  const inSnap = await getDocs(incomingQ);
  const outSnap = await getDocs(outgoingQ);
  const incoming = inSnap.docs.map((d) => ({ ...d.data(), id: d.id }));
  const outgoing = outSnap.docs.map((d) => ({ ...d.data(), id: d.id }));
  const promises: Array<Promise<DocumentSnapshot<UserProfile>>> = [];
  new Set([...incoming, ...outgoing].flatMap((req) => [req.from, req.to])).forEach(((id) => promises.push(getDoc(Schema.profile(id)))));
  const users = await Promise.all(promises);
  return {
    incoming, outgoing, profiles: Object.fromEntries(users.map((profile) => [profile.id, profile.data()])),
  };
}

function ProfileList({ profiles }: { profiles: Array<UserProfile> }) {
  return (
    <ul>
      {profiles.map((profile) => (
        <li key={profile.username}>
          {profile.photoUrl
            ? <Image src={profile.photoUrl} className="w-8 h-8 rounded-full" />
            : <div className="w-8 h-8 bg-blue-300 rounded-full" />}
          <span className="ml-2">
            <Link href={`/user/${profile.username}`}>
              <a>
                {profile.username}
              </a>
            </Link>
          </span>
        </li>
      ))}
    </ul>
  );
}

function Friends() {
  const userId = Auth.useAuthProperty('uid');
  const { data, error } = useSWR(userId, fetchFriendRequests);

  if (error) {
    console.error(error);
    return <pre>{JSON.stringify(error)}</pre>;
  }

  if (!data) return <p>Loading...</p>;

  const { incoming, outgoing, profiles } = data;
  const tabClass = ({ selected }: { selected: boolean }) => `${selected ? 'bg-blue-500' : 'bg-blue-300'} px-4 py-2 rounded outline-none`;
  const friends = allTruthy([...incoming.map((req) => (req.accepted ? profiles[req.from] : null)), ...outgoing.map((req) => (req.accepted ? profiles[req.to] : null))]);
  const incomingPending = allTruthy(incoming.map((req) => (req.accepted ? null : profiles[req.from])));
  return (
    <Tab.Group>
      <Tab.List className="grid grid-cols-2">
        <Tab className={tabClass}>My friends</Tab>
        <Tab className={tabClass}>Incoming requests</Tab>
      </Tab.List>
      <Tab.Panels className="p-4 bg-gray-200">
        <Tab.Panel>
          {friends.length > 0
            ? <ProfileList profiles={friends} />
            : <p>You haven&rsquo;t added any friends yet.</p>}
        </Tab.Panel>
        <Tab.Panel>
          {incomingPending.length > 0
            ? <ProfileList profiles={incomingPending} />
            : <p>No pending friend requests</p>}
        </Tab.Panel>
      </Tab.Panels>
    </Tab.Group>
  );
}

export default function ConnectPage() {
  const userId = Auth.useAuthProperty('uid');
  const schedules = useAppSelector(Schedules.selectSchedules);
  const classCache = useAppSelector(ClassCache.selectClassCache);
  const constraints = useMemo(() => [where('public', '==', true)], []);
  const elapsed = useElapsed(5000, []);

  if (userId === null) {
    return <UnauthorizedPage />;
  }

  if (typeof userId === 'undefined') {
    if (elapsed) return <LoadingPage />;
    return <Layout />;
  }

  return (
    <Layout title="Connect" scheduleQueryConstraints={constraints} className="mx-auto flex-1 w-full max-w-screen-md space-y-8 mt-8">
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
