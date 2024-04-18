import Link from 'next/link';
import { useMemo } from 'react';
import { ImageWrapper } from '@/components/Utils/UserLink';
import { CourseCard } from '@/components/Course/CourseCard';
import { ClassCache } from '@/src/features';
import { useAppSelector, useProfiles } from '@/src/utils/hooks';
import type { BaseSchedule, UserProfile, WithId } from '@/src/types';
import { classNames } from '@/src/utils/styles';
import { useCourseCardStyle } from '@/src/context/CourseCardStyleProvider';
import CardExpandToggler from '../YearSchedule/CardExpandToggler';

export type ScheduleListProps = {
  schedule: BaseSchedule;
  hideAuthor?: boolean;
  hideHeader?: boolean;
  noPadding?: boolean;
};

export function ScheduleSection({
  schedule, hideAuthor = false, hideHeader = false, noPadding = false,
}: ScheduleListProps) {
  const classCache = useAppSelector(ClassCache.selectClassCache);
  const initialized = useAppSelector(ClassCache.selectInitialized);
  const { style: expandCards } = useCourseCardStyle();

  // make a singleton list of the owner's uid so that we can use it as a dependency
  const ownerUid = useMemo(() => [schedule.ownerUid], [schedule.ownerUid]);
  const profiles = useProfiles(ownerUid);
  const profile = profiles?.[schedule.ownerUid];

  return (
    <div className={classNames(
      'rounded-xl',
      !noPadding && 'p-4 border-2 border-gray-secondary',
    )}
    >
      {!hideHeader && (
        <HeaderComponent
          hideAuthor={hideAuthor}
          profile={profile}
          schedule={schedule}
        />
      )}

      {initialized ? (schedule.classes && schedule.classes.length > 0 ? (
        <ul className={classNames(
          expandCards === 'text' && 'list-inside list-disc',
          expandCards === 'collapsed' && 'flex flex-wrap gap-2',
          expandCards === 'expanded' && 'flex flex-wrap justify-between gap-2',
        )}
        >
          {schedule.classes.map((classId) => (classId in classCache ? (
            <li key={classId} className="max-w-xs">
              <CourseCard
                course={classCache[classId]}
                hideTerm
              />
            </li>
          ) : (
            <li key={classId}>
              Unknown class
              {' '}
              {classId.slice(0, 12)}
              ...
            </li>
          )))}
        </ul>
      ) : <p>No classes yet</p>) : <p>Loading courses...</p>}
    </div>
  );
}

function HeaderComponent({
  hideAuthor, profile, schedule,
}: {
  hideAuthor: boolean, profile: WithId<UserProfile> | undefined, schedule: BaseSchedule
}) {
  if (hideAuthor) {
    return (
      <h3 className="mb-2">
        {`${schedule.title} (${schedule.season} ${schedule.year})`}
      </h3>
    );
  }

  return (
    <div className="mb-2 flex items-center space-x-4">
      <ImageWrapper url={profile?.photoUrl} alt="User profile" />

      <div>
        <p>
          {profile
            ? (
              <Link href={`/user/${profile.username}`} className="interactive font-bold">
                {profile.displayName || profile.username}
              </Link>
            )
            : 'Anonymous User'}
          {` (${schedule.season} ${schedule.year})`}
        </p>
        <p className="text-sm">
          {schedule.title}
        </p>
      </div>
    </div>

  );
}

export function ScheduleList({
  title = 'Schedules',
  schedules,
  hideAuthor = false,
  className = 'space-y-2',
}: {
  title?: string;
  schedules: BaseSchedule[];
  hideAuthor?: boolean;
  className?: string;
}) {
  return (
    <section>
      <div className="mb-4 flex items-center justify-between border-b-2">
        <h2>
          {title}
        </h2>
        <CardExpandToggler />
      </div>

      {schedules.length > 0 ? (
        <ul className={className}>
          {schedules.map((schedule) => (
            <li key={schedule.id}>
              <ScheduleSection
                schedule={schedule}
                hideAuthor={hideAuthor}
              />
            </li>
          ))}
        </ul>
      ) : <p>No schedules yet</p>}
    </section>
  );
}
