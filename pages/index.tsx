import {
  Auth,
} from '@/src/features';
import {
  alertUnexpectedError,
} from '@/src/utils/hooks';
import ClassesCloud from '@/components/ClassesCloudPage/ClassesCloudPage';
import { signInUser } from '@/components/Layout/useSyncAuth';
import dynamic from 'next/dynamic';

const DynamicBodySection = dynamic(() => import('@/components/YearSchedule/BodySection'));

export default function PlanPage() {
  const userId = Auth.useAuthProperty('uid');

  if (typeof userId === 'undefined') return null;

  if (userId === null) {
    return (
      <ClassesCloud controls="track">
        <button
          type="button"
          className="relative text-3xl font-black text-white drop-shadow-lg transition-all hover:opacity-80 sm:text-6xl sm:hover:text-[4rem]"
          onClick={() => signInUser().catch(alertUnexpectedError)}
        >
          Sign in to get started!
        </button>
      </ClassesCloud>
    );
  }

  return <DynamicBodySection userId={userId} />;
}


