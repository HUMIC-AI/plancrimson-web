import { BaseSchedule } from '@/src/types';
import { classNames } from '@/src/utils/styles';
import { Disclosure } from '@headlessui/react';
import Link from 'next/link';
import { FaAngleDown } from 'react-icons/fa';
import { getDisplayName } from '@/src/utils/utils';
import ScheduleSection from '../SemesterSchedule/ScheduleList';
import { ProfileWithSchedules } from './useLunrIndex';

export default function ProfileCard({
  profile,
}: {
  profile: ProfileWithSchedules;
}): JSX.Element {
  return (
    <Disclosure>
      {({ open }) => (
        <>
          <Disclosure.Button className="flex w-full rounded-md items-center justify-between space-x-2 transition-colors hover:bg-gray-primary/50">
            <UserHeader profile={profile} />
            <FaAngleDown className={classNames(open && 'rotate-180')} />
          </Disclosure.Button>

          <Disclosure.Panel>
            <p>
              {profile.bio || "This user hasn't written a bio yet."}
            </p>
            {profile.currentSchedules.length > 0 && (
            <ul className="mt-2 space-y-2">
              {profile.currentSchedules.map((schedule) => (
                <li key={schedule.id}>
                  <ProfileSchedules profile={profile} schedule={schedule} />
                </li>
              ))}
            </ul>
            )}
          </Disclosure.Panel>
        </>
      )}
    </Disclosure>
  );
}

export function ProfileSchedules({
  profile,
  schedule,
} : {
  profile: ProfileWithSchedules;
  schedule: BaseSchedule;
}) {
  // previously would collapse if user had more than two schedules
  if (false && profile.currentSchedules.length > 2) {
    return (
      <details>
        <summary className="mb-2 cursor-pointer font-medium">
          {schedule.title}
        </summary>
        <ScheduleSection schedule={schedule} hideHeader noPadding />
      </details>
    );
  }

  return (
    <>
      <h4 className="mb-2 font-medium">
        {schedule.title}
      </h4>
      <ScheduleSection schedule={schedule} hideHeader noPadding />
    </>
  );
}

export function UserHeader({
  profile,
}: {
  profile: ProfileWithSchedules
}) {
  return (
    <h4 title={profile.username!}>
      <Link href={`/user/${profile.username}`} className="rounded px-1 py-0.5 transition-colors hover:text-blue-secondary">
        {getDisplayName(profile)}
      </Link>
      {' '}
      &middot;
      {' '}
      {profile.classYear}
    </h4>
  );
}

