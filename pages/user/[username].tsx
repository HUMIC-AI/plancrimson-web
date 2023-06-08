import {
  where,
} from 'firebase/firestore';
import { useRouter } from 'next/router';
import { useMemo, useState } from 'react';
import { ScheduleList } from '@/components/SemesterSchedule/ScheduleList';
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
import { BioSection } from '@/components/ConnectPageComponents/EditBioForm';
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
    <Layout title={pageProfile.username ?? 'User'} className="mx-auto w-full max-w-screen-md flex-1 p-8" withMeili>
      <UserPage pageProfile={pageProfile} uid={uid} />
    </Layout>
  );
}

function UserPage({ pageProfile, uid }: { uid: string, pageProfile: WithId<UserProfile> }) {
  const scheduleMap = useAppSelector(Schedules.selectSchedules);

  const queryConstraints = useMemo(() => [where('ownerUid', '==', pageProfile.id)], [pageProfile]);

  useSyncSchedulesMatchingContraints(queryConstraints);

  const schedules = sortSchedulesBySemester(scheduleMap);

  return (
    <div className="flex flex-col space-y-8">
      <div>
        {/* top region with image and name */}
        <section className="flex items-center">
          <ImageWrapper url={pageProfile.photoUrl} size="md" alt="User profile" />

          <h1 className="ml-8">{pageProfile.displayName || pageProfile.username || 'Anonymous'}</h1>
        </section>


        {/* bio */}
        <p className="mt-4">
          Class of
          {' '}
          {pageProfile.classYear}
        </p>

        <section className="mt-4">
          <BioSection uid={uid} pageProfile={pageProfile} />
        </section>
      </div>

      {/* schedules */}
      <ScheduleList schedules={schedules} hideAuthor />
    </div>
  );
}


/**
 * @deprecated
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function AddFriendButton({
  pageProfile, uid,
}: {
  pageProfile: WithId<UserProfile>, uid: string,
}) {
  const [refresh, setRefresh] = useState(true);

  const friendStatus = useFriendStatus(uid, pageProfile.id, refresh);

  if (friendStatus === 'self') {
    return null;
  }

  return (
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
      className="interactive mt-2 rounded bg-blue-dark px-2 py-1 text-white"
    >
      {statusMessage[friendStatus]}
    </button>
  );
}

