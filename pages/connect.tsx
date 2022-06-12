import { Tab } from '@headlessui/react';
import {
  deleteDoc,
  getDoc,
  onSnapshot, query, updateDoc, where,
} from 'firebase/firestore';
import Image from 'next/image';
import Link from 'next/link';
import {
  useEffect, useMemo, useState,
} from 'react';
import Layout, { errorMessages, ErrorPage, LoadingPage } from '../components/Layout/Layout';
import { ScheduleSection } from '../components/UserLink';
import { FriendRequest, Schema, UserProfileWithId } from '../shared/firestoreTypes';
import { allTruthy } from '../shared/util';
import { Auth, Schedules } from '../src/features';
import { useAppSelector, useElapsed, useProfiles } from '../src/hooks';

function useFriendRequests(uid: string | null | undefined) {
  const [incoming, setIncoming] = useState<(FriendRequest & { id: string })[]>([]);
  const [outgoing, setOutgoing] = useState<(FriendRequest & { id: string })[]>([]);

  const incomingQ = query(Schema.Collection.allFriends(), where('to', '==', uid));
  const outgoingQ = query(Schema.Collection.allFriends(), where('from', '==', uid));

  useEffect(() => {
    if (!uid) return;
    const unsubIn = onSnapshot(incomingQ, (snap) => setIncoming(snap.docs.map((d) => ({ ...d.data(), id: d.id }))));
    const unsubOut = onSnapshot(outgoingQ, (snap) => setOutgoing(snap.docs.map((d) => ({ ...d.data(), id: d.id }))));
    return () => {
      unsubIn();
      unsubOut();
    };
  }, [uid]);

  return { incoming, outgoing };
}

function ProfileList({ profiles, Button }: { profiles: Array<UserProfileWithId>, Button: React.FC<{ profile: UserProfileWithId }> }) {
  return (
    <div className="grid grid-cols-[auto_1fr] gap-4">
      {profiles.map((profile) => (
        <li key={profile.id} className="contents">
          <div className="flex items-center">
            {profile.photoUrl
              ? <Image src={profile.photoUrl} className="w-8 h-8 rounded-full" />
              : <div className="w-8 h-8 bg-blue-300 rounded-full" />}

            <Link href={`/user/${profile.username}`}>
              <a className="font-bold ml-2">
                {profile.username}
              </a>
            </Link>
          </div>

          <div>
            <Button profile={profile} />
          </div>
        </li>
      ))}
    </div>
  );
}


function UnfriendButton({ profile }: { profile: UserProfileWithId }) {
  const userId = Auth.useAuthProperty('uid');

  return (
    <button
      type="button"
      onClick={async () => {
        const outgoing = await getDoc(Schema.friendRequest(userId!, profile.id));
        if (outgoing.exists()) {
          await deleteDoc(outgoing.ref);
        } else {
          await deleteDoc(Schema.friendRequest(profile.id, userId!));
        }
      }}
      className="interactive px-2 py-1 bg-blue-900 text-white rounded"
    >
      Unfriend
    </button>
  );
}

function IncomingRequestButtons({ profile }: { profile: UserProfileWithId }) {
  const userId = Auth.useAuthProperty('uid');

  const ref = Schema.friendRequest(profile.id, userId!);
  return (
    <>
      <button
        type="button"
        onClick={() => {
          updateDoc(ref, { accepted: true }).catch((err) => console.error('error accepting request', err));
        }}
        className="interactive px-2 py-1 bg-blue-900 text-white rounded"
      >
        Accept
      </button>
      <button
        type="button"
        onClick={() => {
          deleteDoc(ref).catch((err) => console.error('error rejecting request', err));
        }}
        className="interactive px-2 py-1 bg-blue-900 text-white rounded ml-2"
      >
        Reject
      </button>
    </>
  );
}

function Friends() {
  const userId = Auth.useAuthProperty('uid');
  const { incoming, outgoing } = useFriendRequests(userId);

  const userIds = useMemo(() => {
    const ids: string[] = [];
    new Set([...incoming, ...outgoing].flatMap((req) => [req.from, req.to])).forEach((id) => ids.push(id));
    return ids;
  }, [incoming, outgoing]);

  const profiles = useProfiles(userIds);

  const tabClass = ({ selected }: { selected: boolean }) => `${selected ? 'bg-blue-500' : 'bg-blue-300'} px-4 py-2 outline-none`;
  const friends = allTruthy([...incoming.map((req) => (req.accepted ? profiles[req.from] : null)), ...outgoing.map((req) => (req.accepted ? profiles[req.to] : null))]);
  const incomingPending = allTruthy(incoming.map((req) => (req.accepted ? null : profiles[req.from])));

  return (
    <Tab.Group>
      <Tab.List className="grid grid-cols-2 rounded-t-xl overflow-hidden">
        <Tab className={tabClass}>My friends</Tab>
        <Tab className={tabClass}>Incoming requests</Tab>
      </Tab.List>
      <Tab.Panels className="p-4 bg-gray-200 rounded-b-xl overflow-hidden">
        <Tab.Panel>
          {friends.length > 0
            ? (
              <ProfileList
                profiles={friends}
                Button={UnfriendButton}
              />
            )
            : <p>You haven&rsquo;t added any friends yet.</p>}
        </Tab.Panel>
        <Tab.Panel>
          {incomingPending.length > 0
            ? (
              <ProfileList
                profiles={incomingPending}
                Button={IncomingRequestButtons}
              />
            )
            : <p>No pending friend requests</p>}
        </Tab.Panel>
      </Tab.Panels>
    </Tab.Group>
  );
}

export default function ConnectPage() {
  const userId = Auth.useAuthProperty('uid');
  const schedules = useAppSelector(Schedules.selectSchedules);
  const constraints = useMemo(() => [where('public', '==', true)], []);
  const elapsed = useElapsed(5000, []);

  if (userId === null) {
    return <ErrorPage>{errorMessages.unauthorized}</ErrorPage>;
  }

  if (typeof userId === 'undefined') {
    if (elapsed) return <LoadingPage />;
    return <Layout />;
  }

  return (
    <Layout title="Connect" scheduleQueryConstraints={constraints} className="mx-auto flex-1 w-full max-w-screen-md space-y-8 my-8">
      <h1>Connect with students with similar interests!</h1>
      <section>
        <Friends />
      </section>
      <section>
        <h2 className="text-3xl mb-2">Classmates</h2>
        <p>Find and connect with classmates!</p>
      </section>
      <section>
        <h2 className="text-3xl">Public schedules</h2>
        <ul className="mt-6">
          {Object.values(schedules).map((schedule) => (
            <li key={schedule.id}>
              <ScheduleSection schedule={schedule} />
            </li>
          ))}
        </ul>
      </section>
    </Layout>
  );
}
