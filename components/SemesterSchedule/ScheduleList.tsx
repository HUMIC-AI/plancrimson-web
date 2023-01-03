import CourseCard from 'components/Course/CourseCard';
import { ImageWrapper } from 'components/UserLink';
import Link from 'next/link';
import { useMemo } from 'react';
import { Schedule } from 'shared/types';
import { ClassCache } from 'src/features';
import { useAppSelector, useProfiles } from 'src/hooks';

export type ScheduleListProps = {
  schedule: Schedule;
  hideAuthor?: boolean;
};

export default function ScheduleSection({ schedule, hideAuthor = false }: ScheduleListProps) {
  const classCache = useAppSelector(ClassCache.selectClassCache);
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
          {schedule.classes.map((classData) => (classData.classId in classCache ? (
            <CourseCard
              course={classCache[classData.classId]}
              key={classData.classId}
            />
          ) : (
            <span key={classData.classId}>
              Unknown class
              {' '}
              {classData.classId.slice(0, 12)}
              ...
            </span>
          )))}
        </ul>
      ) : <p>No classes yet</p>}
    </div>
  );
}

