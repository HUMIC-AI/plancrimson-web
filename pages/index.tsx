import {
  Auth,
} from '@/src/features';
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
          onClick={() => signInUser().catch((err) => {
            alert("Couldn't sign in. You may need to disable any popup blockers.");
            console.error('Sign in error:', err);
          })}
        >
          Sign in to get started!
        </button>
      </ClassesCloud>
    );
  }

  return <DynamicBodySection userId={userId} />;
}


