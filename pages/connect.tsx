import { Tab } from '@headlessui/react';
import axios from 'axios';
import { getAuth } from 'firebase/auth';
import {
  deleteDoc, getDoc, limit, updateDoc, where,
} from 'firebase/firestore';
import Image from 'next/image';
import Link from 'next/link';
import {
  useEffect, useMemo, useState,
} from 'react';
import Layout, { errorMessages, ErrorPage, LoadingPage } from '../components/Layout/Layout';
import { ImageWrapper, ScheduleSection } from '../components/UserLink';
import { UserProfileWithId } from '../shared/types';
import Schema from '../shared/schema';
import { allTruthy } from '../shared/util';
import { Auth, Schedules } from '../src/features';
import {
  useAppSelector, useElapsed, useFriendRequests, useProfiles,
} from '../src/hooks';


export default function ConnectPage() {
  const userId = Auth.useAuthProperty('uid');
  const constraints = useMemo(() => [where('public', '==', true), limit(20)], []);
  const elapsed = useElapsed(2000, []);

  const { incoming, outgoing } = useFriendRequests(userId);

  const userIds = useMemo(() => {
    const ids: string[] = [];
    new Set([...incoming, ...outgoing].flatMap((req) => [req.from, req.to])).forEach((id) => ids.push(id));
    return ids;
  }, [incoming, outgoing]);

  const profiles = useProfiles(userIds);

  const tabClass = ({ selected }: { selected: boolean }) => `${selected ? 'bg-blue-500 font-bold flex-1' : 'bg-blue-300'} px-4 py-2 outline-none interactive text-md`;
  const friends = profiles && allTruthy([
    ...incoming.map((req) => (req.accepted ? profiles[req.from] : null)),
    ...outgoing.map((req) => (req.accepted ? profiles[req.to] : null)),
  ]);
  const incomingPending = profiles && allTruthy(incoming.map((req) => (req.accepted ? null : profiles[req.from])));

  if (userId === null) {
    return <ErrorPage>{errorMessages.unauthorized}</ErrorPage>;
  }

  if (typeof userId === 'undefined') {
    if (elapsed) return <LoadingPage />;
    return <Layout />;
  }

  return (
    <Layout title="Connect" scheduleQueryConstraints={constraints} className="mx-auto w-full max-w-screen-md flex-1 p-8">
      <Tab.Group>
        <Tab.List className="mb-4 flex">
          <Tab className={tabClass}>Public schedules</Tab>
          <Tab className={tabClass}>Friends</Tab>
          <Tab className={tabClass}>Incoming requests</Tab>
          <Tab className={tabClass}>Find classmates</Tab>
        </Tab.List>
        <Tab.Panels>
          <Tab.Panel><Panels.PublicSchedules /></Tab.Panel>
          <Tab.Panel><Panels.Friends friends={friends} /></Tab.Panel>
          <Tab.Panel><Panels.IncomingRequests pending={incomingPending} /></Tab.Panel>
          <Tab.Panel><Panels.FindClassmates /></Tab.Panel>
        </Tab.Panels>
      </Tab.Group>
    </Layout>
  );
}

const Panels = {
  PublicSchedules() {
    // the proper schedules are already selected by the constraints argument to Layout
    const schedules = useAppSelector(Schedules.selectSchedules);

    if (Object.values(schedules).length === 0) {
      return <p>Nobody has made a public schedule yet. Keep an eye out!</p>;
    }

    return (
      <ul className="mt-6">
        {Object.values(schedules).filter((schedule) => schedule.public).map((schedule) => (
          <li key={schedule.id}>
            <ScheduleSection schedule={schedule} />
          </li>
        ))}
      </ul>
    );
  },
  Friends({ friends }: { friends: UserProfileWithId[] | undefined }) {
    const elapsed = useElapsed(500, []);

    if (typeof friends === 'undefined') {
      if (elapsed) return <p>Loading...</p>;
      return null;
    }

    if (friends.length === 0) {
      return <p>You haven&rsquo;t added any friends yet.</p>;
    }

    return (
      <ProfileList
        profiles={friends}
        Button={UnfriendButton}
      />
    );
  },
  IncomingRequests({ pending } : { pending: UserProfileWithId[] | undefined }) {
    const elapsed = useElapsed(500, []);

    if (typeof pending === 'undefined') {
      if (elapsed) return <p>Loading...</p>;
      return null;
    }

    if (pending.length === 0) {
      return <p>No pending friend requests.</p>;
    }

    return (
      <ProfileList
        profiles={pending}
        Button={IncomingRequestButtons}
      />
    );
  },
  FindClassmates() {
    const suggestedProfiles = useSuggestedProfiles();
    const ids = useMemo(() => suggestedProfiles?.map(([id]) => id), [suggestedProfiles]);
    const profiles = useProfiles(ids);
    const elapsed = useElapsed(500, []);

    if (typeof suggestedProfiles === 'undefined' || typeof profiles === 'undefined') {
      if (elapsed) return <p>Loading...</p>;
      return null;
    }

    if (suggestedProfiles.length === 0) {
      return <p>No users found yet. Create some schedules to meet classmates!</p>;
    }

    return (
      <ul className="flex flex-wrap justify-around">
        {suggestedProfiles.map(([profileId, numSharedCourses]) => {
          const profile = profiles[profileId];
          return (
            <li key={profileId}>
              <Link href={profile ? `/user/${profile.username}` : '#'} className="interactive m-2 block rounded-xl bg-gray-300 px-4 py-2 shadow">
                <div className="flex items-center space-x-4">
                  <ImageWrapper url={profile?.photoUrl} alt="User profile" />
                  <div>
                    <span className="font-bold">{profile?.username || 'Loading...'}</span>
                    <p>
                      {numSharedCourses}
                      {' '}
                      courses in common
                    </p>
                  </div>
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
    );
  },
};

function useSuggestedProfiles() {
  // a list of user ids and the number of courses in common
  const [profiles, setProfiles] = useState<[string, number][]>();

  useEffect(() => {
    const lastUpdated = parseInt(sessionStorage.getItem('suggestProfiles/lastUpdated')!, 10);
    const profilesData = sessionStorage.getItem('suggestProfiles/profiles');

    let stale = isNaN(lastUpdated) || Date.now() - lastUpdated > 1000; // every hour

    if (!stale) {
      try {
        const data = JSON.parse(profilesData!);
        if (Object.entries(data).every(([a, b]) => typeof a === 'string' && (b as string[]).every((t) => typeof t === 'string'))) {
          setProfiles(data);
        } else {
          stale = true;
        }
      } catch (err) {
        stale = true;
      }
    }

    if (stale) {
      const user = getAuth().currentUser;
      if (!user) {
        console.error('not signed in');
        return;
      }
      user.getIdToken(true)
        .then((token) => axios({ url: '/api/suggestProfiles', headers: { authorization: `Bearer ${token}` } }))
        .then(({ data }) => {
          sessionStorage.setItem('suggestProfiles/lastUpdated', Date.now().toString());
          sessionStorage.setItem('suggestProfiles/profiles', JSON.stringify(data));
          setProfiles(data);
        })
        .catch((err) => {
          console.error('error getting suggested profiles:', err);
        });
    }
  }, []);

  return profiles;
}

function ProfileList({ profiles, Button }: { profiles: Array<UserProfileWithId>, Button: React.FC<{ profile: UserProfileWithId }> }) {
  return (
    <div className="grid grid-cols-[auto_1fr] gap-4">
      {profiles.map((profile) => (
        <li key={profile.id} className="contents">
          <div className="flex items-center">
            {profile.photoUrl
              ? <Image src={profile.photoUrl} alt="User profile" className="h-8 w-8 rounded-full" />
              : <div className="h-8 w-8 rounded-full bg-blue-300" />}

            <Link href={`/user/${profile.username}`} className="ml-2 font-bold">
              {profile.username}
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
      className="interactive rounded bg-blue-900 px-2 py-1 text-white"
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
        className="interactive rounded bg-blue-900 px-2 py-1 text-white"
      >
        Accept
      </button>
      <button
        type="button"
        onClick={() => {
          deleteDoc(ref).catch((err) => console.error('error rejecting request', err));
        }}
        className="interactive ml-2 rounded bg-blue-900 px-2 py-1 text-white"
      >
        Reject
      </button>
    </>
  );
}
