import Link from 'next/link';
import Image from 'next/image';
import { FaUser } from 'react-icons/fa';
import { useMemo } from 'react';
import { Schedule } from '../shared/types';
import { useModal } from '../src/context/modal';
import { ClassCache } from '../src/features';
import { useAppSelector, useProfiles } from '../src/hooks';
import CourseCard from './Course/CourseCard';
import { classNames } from '../shared/util';


export function UserLink({ uid }: { uid: string }) {
  return <Link href={`/user/${uid}`}><a>{uid}</a></Link>;
}


export function ImageWrapper({ url, size = 'sm' }: { url: string | null | undefined, size?: 'sm' | 'md' }) {
  if (url) {
    return (
      <Image
        className={classNames(
          size === 'sm' ? 'h-8 w-8' : 'h-16 w-16',
          'rounded-full',
        )}
        src={url}
        width={size === 'sm' ? 32 : 64}
        height={size === 'md' ? 32 : 64}
      />
    );
  }

  return (
    <FaUser className={classNames(
      size === 'sm' ? 'h-8 w-8 p-1' : 'h-16 w-16 p-2',
      'text-white bg-blue-900 rounded-full',
    )}
    />
  );
}


export function ScheduleSection({ schedule }: { schedule: Schedule }) {
  const classCache = useAppSelector(ClassCache.selectClassCache);
  const { showCourse } = useModal();
  const ownerUid = useMemo(() => [schedule.ownerUid], [schedule.ownerUid]);
  const profiles = useProfiles(ownerUid);
  const profile = profiles?.[schedule.ownerUid];

  return (
    <div className="rounded-xl shadow-xl bg-blue-300 p-4">
      <div className="flex space-x-4 items-center">
        <ImageWrapper url={profile?.photoUrl} />
        <div>
          <h3 className="flex items-center">
            <span className="text-xl font-bold">
              {schedule.title}
            </span>
            <span className="ml-2">
              {`(${schedule.season} ${schedule.year})`}
            </span>
          </h3>

          <p>
            by
            {' '}
            {profile
              ? (
                <Link href={`/user/${profile.username}`}>
                  <a>
                    {profile.username}
                  </a>
                </Link>
              )
              : 'Anonymous User'}
          </p>
        </div>
      </div>

      <ul className="flex flex-wrap mt-2">
        {schedule.classes.map((classData) => classData.classId in classCache && (
        <li key={classData.classId} className="mr-2">
          <CourseCard
            chosenScheduleId={schedule.id}
            course={classCache[classData.classId]}
            inSearchContext={false}
            handleExpand={showCourse}
            interactive={false}
          />
        </li>
        ))}
      </ul>
    </div>
  );
}
