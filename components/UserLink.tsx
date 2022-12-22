import Link from 'next/link';
import Image from 'next/image';
import { FaUser } from 'react-icons/fa';
import { useMemo } from 'react';
import { Schedule } from '../shared/types';
import { useModal } from '../src/context/modal';
import { ClassCache } from '../src/features';
import { useAppSelector, useProfiles } from '../src/hooks';
import { classNames } from '../shared/util';


export function UserLink({ uid }: { uid: string }) {
  return <Link href={`/user/${uid}`}>{uid}</Link>;
}


export function ImageWrapper({ url, alt, size = 'sm' }: { url: string | null | undefined, alt: string, size?: 'sm' | 'md' }) {
  if (url) {
    return (
      <Image
        className={classNames(
          size === 'sm' ? 'h-8 w-8' : 'h-16 w-16',
          'rounded-full',
        )}
        src={url}
        alt={alt}
        width={size === 'sm' ? 32 : 64}
        height={size === 'sm' ? 32 : 64}
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
    <div className="rounded-xl bg-blue-300 p-4 shadow-xl">
      <div className="flex items-center space-x-4">
        <ImageWrapper url={profile?.photoUrl} alt="User profile" />
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
                  {profile.username}
                </Link>
              )
              : 'Anonymous User'}
          </p>
        </div>
      </div>

      <ul className="mt-2 list-inside list-disc">
        {schedule.classes.map((classData) => classData.classId in classCache && (
        <li key={classData.classId}>
          <button type="button" className="font-bold underline transition-opacity hover:opacity-50" onClick={() => showCourse(classCache[classData.classId])}>
            {classCache[classData.classId].SUBJECT}
            {classCache[classData.classId].CATALOG_NBR}
            :
          </button>
          {' '}
          {classCache[classData.classId].Title}
        </li>
        ))}
      </ul>
    </div>
  );
}
