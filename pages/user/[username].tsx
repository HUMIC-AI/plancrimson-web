import {
  onSnapshot,
  query,
  where,
} from 'firebase/firestore';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { ScheduleList } from '@/components/SemesterSchedule/ScheduleList';
import {
  alertUnexpectedError,
  useAppDispatch,
  useElapsed,
} from '@/src/utils/hooks';
import { sendFriendRequest, unfriend, useFriends } from '@/components/ConnectPageComponents/friendUtils';
import Layout from '@/components/Layout/Layout';
import { LoadingBars } from '@/components/Layout/LoadingPage';
import { ImageWrapper } from '@/components/Utils/UserLink';
import {
  BaseSchedule, UserProfile, WithId,
} from '@/src/types';
import { BioSection } from '@/components/ConnectPageComponents/EditBioForm';
import { useProfile, useFriendStatus, FriendStatus } from '@/components/ConnectPageComponents/useProfile';
import { IncomingRequestButtons, IncomingRequestList } from '@/components/ConnectPageComponents/FriendRequests';
import { ErrorMessage } from '@/components/Layout/ErrorMessage';
import CourseCardStyleProvider from '@/src/context/CourseCardStyleProvider';
import Schema from '@/src/schema';
import { compareSemesters } from '@/src/lib';
import { ScheduleSyncer } from '@/components/Utils/ScheduleSyncer';
import { ClassCache } from '@/src/features';
import { getAllClassIds } from '@/src/utils/schedules';
import { useMeiliClient } from '@/src/context/meili';

const statusMessage: Record<FriendStatus, string> = {
  loading: 'Loading...',
  self: '',
  none: 'Add friend',
  friends: 'Unfriend',
  'pending-incoming': 'ERROR',
  'pending-outgoing': 'Cancel request',
};

export default function () {
  const router = useRouter();
  const username = router.query.username as string;

  // need to put UserPage inside layout to access MeiliSearch context provider
  return (
    <Layout title={username ?? 'User'} className="mx-auto w-full max-w-screen-md flex-1 p-8" verify="meili">
      {({ userId }) => (
        <CourseCardStyleProvider defaultStyle="collapsed">
          <Wrapper userId={userId} />
        </CourseCardStyleProvider>
      )}
    </Layout>
  );
}

function Wrapper({ userId }: { userId: string }) {
  const router = useRouter();
  const username = router.query.username as string;
  const elapsed = useElapsed(500, []);
  const [pageProfile, error] = useProfile(username, userId);

  if (error) {
    return <ErrorMessage>{error.message}</ErrorMessage>;
  }

  if (!pageProfile) {
    return elapsed ? <LoadingBars /> : null;
  }

  return <UserPage userId={userId} pageProfile={pageProfile} />;
}


function UserPage({ pageProfile, userId }: { userId: string, pageProfile: WithId<UserProfile> }) {
  const dispatch = useAppDispatch();
  const { client } = useMeiliClient();
  const [refresh, setRefresh] = useState(true);
  const [schedules, setSchedules] = useState<BaseSchedule[]>([]);

  const friendStatus = useFriendStatus(userId, pageProfile.id, refresh);
  const { incomingPending } = useFriends(userId);

  useEffect(() => {
    const constraints = [where('ownerUid', '==', pageProfile.id)];

    if (friendStatus !== 'friends' && friendStatus !== 'self') {
      constraints.push(where('public', '==', true));
    }

    return onSnapshot(query(Schema.Collection.schedules(), ...constraints), (snap) => {
      const newSchedules = snap.docs.map((doc) => doc.data());
      setSchedules(newSchedules.sort(compareSemesters));
      if (client) {
        dispatch(ClassCache.loadCourses(client, getAllClassIds(newSchedules)))
          .then(() => console.info('Loaded new courses from snapshot'))
          .catch(alertUnexpectedError);
      }
    }, alertUnexpectedError);
  }, [pageProfile, friendStatus, dispatch, client]);

  return (
    <div className="flex flex-col space-y-8">
      <ScheduleSyncer userId={userId} />

      <IncomingRequestList incomingPending={incomingPending} />

      <div>
        {/* top region with image and name */}
        <section className="flex items-center">
          <ImageWrapper url={pageProfile.photoUrl} size="md" alt="User profile" />

          <div className="ml-8">
            <h1 className="text-3xl">{pageProfile.username}</h1>

            {friendStatus === 'pending-incoming' ? (
              <IncomingRequestButtons profile={pageProfile} />
            ) : friendStatus !== 'self' && (
              <button
                type="button"
                onClick={() => {
                  if (friendStatus === 'friends' || friendStatus === 'pending-outgoing') {
                    unfriend(userId, pageProfile.id);
                    setRefresh(!refresh);
                  } else if (friendStatus === 'none') {
                    sendFriendRequest(userId, pageProfile.id);
                    setRefresh(!refresh);
                  }
                }}
                className="interactive mt-2 rounded bg-gray-secondary px-2 py-1"
              >
                {statusMessage[friendStatus]}
              </button>
            )}
          </div>
        </section>

        {/* bio */}
        <p className="mt-4">
          Class of
          {' '}
          {pageProfile.classYear}
        </p>

        <section className="mt-4">
          <BioSection userId={userId} pageProfile={pageProfile} />
        </section>
      </div>

      {/* schedules */}
      <ScheduleList
        title={(friendStatus === 'friends' || friendStatus === 'self')
          ? 'Schedules'
          : 'Public schedules'}
        schedules={schedules}
        hideAuthor
      />
    </div>
  );
}


