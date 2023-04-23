import Link from 'next/link';
import { useMemo } from 'react';
import { ImageWrapper } from '@/components/Utils/UserLink';
import CourseCard from '@/components/Course/CourseCard';
import { ClassCache, Planner } from '@/src/features';
import { useAppSelector, useProfiles } from '@/src/utils/hooks';
import type { Schedule } from '@/src/types';

export type ScheduleListProps = {
  schedule: Schedule;
  hideAuthor?: boolean;
};

export default function ScheduleSection({ schedule, hideAuthor = false }: ScheduleListProps) {
  const classCache = useAppSelector(ClassCache.selectClassCache);
  const cardExpand = useAppSelector(Planner.selectExpandCards);

  // make a singleton list of the owner's uid so that we can use it as a dependency
  const ownerUid = useMemo(() => [schedule.ownerUid], [schedule.ownerUid]);
  const profiles = useProfiles(ownerUid);
  const profile = profiles?.[schedule.ownerUid];

  return (
    <div className="dark-gradient rounded-xl p-4 text-gray-light shadow-xl">
      <div className="mb-2 flex items-center space-x-4">
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
        <ul className={cardExpand === 'text' ? 'list-inside list-disc' : cardExpand === 'collapsed' ? 'flex space-x-2' : 'flex flex-wrap justify-between gap-2'}>
          {schedule.classes.map((classData) => (classData.classId in classCache ? (
            <li key={classData.classId} className="max-w-xs">
              <CourseCard
                course={classCache[classData.classId]}
                inSearchContext={false}
                hideTerm
              />
            </li>
          ) : (
            <li key={classData.classId}>
              Unknown class
              {' '}
              {classData.classId.slice(0, 12)}
              ...
            </li>
          )))}
        </ul>
      ) : <p>No classes yet</p>}
    </div>
  );
}

