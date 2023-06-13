import React, { useMemo } from 'react';
import { FaPlus } from 'react-icons/fa';
import { findConflicts, allTruthy } from '@/src/lib';
import { useAppSelector, useElapsed } from '@/src/utils/hooks';
import { Requirement } from '@/src/requirements/util';
import {
  ClassCache, Profile, Schedules,
} from '@/src/features';
import AddCoursesButton from '@/components/AddCoursesButton';
import { getClasses } from '@/src/features/schedules';
import CourseCard from '../../Course/CourseCard';

type Props = {
  scheduleId: string;
  highlightedRequirement: Requirement | undefined;
};

export function CoursesSection({ scheduleId, highlightedRequirement }: Props) {
  const schedule = useAppSelector(Schedules.selectSchedule(scheduleId));
  const profile = useAppSelector(Profile.selectUserProfile);
  const classCache = useAppSelector(ClassCache.selectClassCache);
  const initialized = useAppSelector(ClassCache.selectInitialized);
  const conflicts = useMemo(
    () => schedule && findConflicts(allTruthy(schedule.classes ? schedule.classes.map((classId) => classCache[classId]) : [])),
    [schedule, classCache],
  );
  const elapsed = useElapsed(3000, []);

  if (!schedule) {
    console.error(`Schedule ${scheduleId} not found`);
    return null;
  }

  const doHighlight = (id: string) => highlightedRequirement && highlightedRequirement.reducer(
    highlightedRequirement.initialValue || 0,
    classCache[id],
    schedule!,
    profile,
  ) !== null;

  const warnings = (id: string) => ((conflicts?.[id]?.length ?? 0) > 0
    ? `This class conflicts with: ${conflicts![id].map((i) => classCache[i].SUBJECT + classCache[i].CATALOG_NBR).join(', ')}`
    : undefined);

  return (
    <div className="h-max flex-1 overflow-auto p-4">
      <div className="flex min-h-[12rem] flex-col items-stretch space-y-4">
        <AddCoursesButton schedule={schedule}>
          <FaPlus className="mr-2" />
          Add courses
        </AddCoursesButton>

        {initialized ? getClasses(schedule).map((id) => (id && classCache[id] ? (
          <CourseCard
            key={id}
            course={classCache[id]}
            highlight={doHighlight(id)}
            chosenScheduleId={schedule.id}
            inSearchContext={false}
            warnings={warnings(id)}
          />
        ) : (
          <div key={id}>{elapsed ? `Course ${id.slice(0, 12)}... not found` : 'Loading course data...'}</div>
        ))) : (
          <p>Loading course data...</p>
        )}
      </div>
    </div>
  );
}
