import {
  where,
} from 'firebase/firestore';
import { useRouter } from 'next/router';
import { useMemo, useState } from 'react';
import ScheduleSection from '@/components/SemesterSchedule/ScheduleList';
import CardExpandToggler from '@/components/YearSchedule/CardExpandToggler';
import { Auth, Schedules } from '@/src/features';
import {
  useAppSelector, useElapsed,
} from '@/src/utils/hooks';
import { sendFriendRequest, unfriend } from '@/components/ConnectPageComponents/friendUtils';
import Layout, { errorMessages } from '@/components/Layout/Layout';
import { ErrorPage } from '@/components/Layout/ErrorPage';
import { LoadingBars } from '@/components/Layout/LoadingPage';
import { ImageWrapper } from '@/components/Utils/UserLink';
import { UserProfile, WithId } from '@/src/types';
import useSyncSchedulesMatchingContraints, { sortSchedulesBySemester } from '@/src/utils/schedules';
import { EditBioForm } from '@/components/ConnectPageComponents/EditBioForm';
import { useProfile, useFriendStatus, FriendStatus } from '@/components/ConnectPageComponents/useProfile';

const statusMessage: Record<FriendStatus, string> = {
  loading: 'Loading...',
  self: '',
  none: 'Add friend',
  friends: 'Unfriend',
  pending: 'Cancel request',
};

export default function () {
  const router = useRouter();
  const username = router.query.username as string;
  const [pageProfile, error] = useProfile(username);
  const uid = Auth.useAuthProperty('uid');
  const elapsed = useElapsed(5000, [username]);

  if (error) {
    return <ErrorPage>{error.message}</ErrorPage>;
  }

  if (!pageProfile) {
    return (
      <Layout>
        <LoadingBars />
      </Layout>
    );
  }

  if (uid === null) {
    return <ErrorPage>{errorMessages.unauthorized}</ErrorPage>;
  }

  if (typeof uid === 'undefined') {
    return (
      <Layout>
        {elapsed && <LoadingBars />}
      </Layout>
    );
  }

  // need to put UserPage inside layout to access MeiliSearch context provider
  return (
    <Layout title={pageProfile.username ?? 'User'} className="mx-auto w-full max-w-screen-md flex-1 p-8">
      <UserPage username={username} pageProfile={pageProfile} uid={uid} />
    </Layout>
  );
}

function UserPage({ username, pageProfile, uid }: { uid: string, username: string, pageProfile: WithId<UserProfile> }) {
  const scheduleMap = useAppSelector(Schedules.selectSchedules);
  const [refresh, setRefresh] = useState(true);

  const friendStatus = useFriendStatus(uid, pageProfile.id, refresh);

  const queryConstraints = useMemo(() => {
    if (friendStatus === 'friends' || friendStatus === 'self') {
      return [where('ownerUid', '==', pageProfile.id)];
    }

    return [where('ownerUid', '==', pageProfile.id), where('public', '==', true)];
  }, [uid, pageProfile, friendStatus]);

  useSyncSchedulesMatchingContraints(queryConstraints);

  const schedules = sortSchedulesBySemester(scheduleMap);

  return (
    <div className="flex flex-col space-y-8">
      <div>
        {/* top region with image and name */}
        <div className="flex items-center">
          <ImageWrapper url={pageProfile.photoUrl} size="md" alt="User profile" />

          <div className="ml-8">
            <h1 className="text-3xl">{pageProfile.username}</h1>

            {friendStatus !== 'self' && (
              <button
                type="button"
                onClick={() => {
                  if (friendStatus === 'friends' || friendStatus === 'pending') {
                    unfriend(uid, pageProfile.id);
                    setRefresh(!refresh);
                  } else if (friendStatus === 'none') {
                    sendFriendRequest(uid, pageProfile.id);
                    setRefresh(!refresh);
                  }
                }}
                className="interactive mt-2 rounded bg-primary-dark px-2 py-1 text-white"
              >
                {statusMessage[friendStatus]}
              </button>
            )}
          </div>
        </div>

        {/* bio */}
        <p className="mt-4">
          Class of
          {' '}
          {pageProfile.classYear}
        </p>

        <h3 className="mt-4 text-xl font-medium">Bio</h3>
        {/* show an editable textarea for own page, otherwise other's bio */}
        {pageProfile.id === uid ? (
          <EditBioForm uid={uid} />
        ) : (
          <p className="mt-2">{pageProfile.bio}</p>
        )}
      </div>

      {/* schedules */}
      <section>
        <div className="mb-4 flex items-center justify-between border-b-2">
          <h2 className="text-xl font-medium">
            Schedules
          </h2>
          <CardExpandToggler />
        </div>

        {schedules.length > 0 ? (
          <ul className="space-y-2">
            {schedules.map((schedule) => (
              <li key={schedule.id}>
                <ScheduleSection schedule={schedule} hideAuthor />
              </li>
            ))}
          </ul>
        ) : <p>No schedules yet</p>}
      </section>
    </div>
  );
}


