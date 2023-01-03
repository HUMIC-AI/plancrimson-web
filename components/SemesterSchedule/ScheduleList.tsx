import { ImageWrapper } from 'components/UserLink';
import Link from 'next/link';
import { useMemo } from 'react';
import { Schedule } from 'shared/types';
import { useModal } from 'src/context/modal';
import { ClassCache } from 'src/features';
import { useAppSelector, useProfiles } from 'src/hooks';

export default function ScheduleSection({ schedule, hideAuthor = false }: { schedule: Schedule, hideAuthor?: boolean }) {
  const classCache = useAppSelector(ClassCache.selectClassCache);
  const { showCourse } = useModal();
  const ownerUid = useMemo(() => [schedule.ownerUid], [schedule.ownerUid]);
  const profiles = useProfiles(ownerUid);
  const profile = profiles?.[schedule.ownerUid];

  return (
    <div className="dark-gradient rounded-xl p-4 text-slate-200 shadow-xl">
      <div className="flex items-center space-x-4">
        {!hideAuthor && <ImageWrapper url={profile?.photoUrl} alt="User profile" />}
        <div>
          <h3 className="flex items-center">
            <span className="text-xl font-bold">
              {schedule.title}
            </span>
            <span className="ml-2">
              {`(${schedule.season} ${schedule.year})`}
            </span>
          </h3>

          {!hideAuthor && (
          <p>
            by
            {' '}
            {profile
              ? (
                <Link href={`/user/${profile.username}`} className="interactive font-bold">
                  {profile.username}
                </Link>
              )
              : 'Anonymous User'}
          </p>
          )}
        </div>
      </div>

      {schedule.classes.length > 0 ? (
        <ul className="mt-2 list-inside list-disc">
          {schedule.classes.map((classData) => classData.classId in classCache && (
          <li key={classData.classId}>
            <button
              type="button"
              className="font-bold underline transition-opacity hover:opacity-50"
              onClick={() => showCourse(classCache[classData.classId])}
            >
              {classCache[classData.classId].SUBJECT}
              {classCache[classData.classId].CATALOG_NBR}
              :
            </button>
            {' '}
            {classCache[classData.classId].Title}
          </li>
          ))}
        </ul>
      ) : <p>No classes yet</p>}
    </div>
  );
}

