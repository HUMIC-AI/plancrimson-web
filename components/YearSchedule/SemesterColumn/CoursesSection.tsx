import React from 'react';
import { FaPlus } from 'react-icons/fa';
import { useAppSelector, useElapsed } from '@/src/utils/hooks';
import { Requirement } from '@/src/requirements/util';
import {
  ClassCache, Profile,
} from '@/src/features';
import AddCoursesButton from '@/components/SemesterSchedule/AddCoursesButton';
import { getClassIdsOfSchedule } from '@/src/features/schedules';
import { CourseCard } from '../../Course/CourseCard';
import { useChosenSchedule } from '../../../src/context/ScheduleProvider';
import { LoadingText } from '../../Layout/LoadingPage';
import { useConflicts } from '../../../src/searchSchedule';
import { RemoveCourseButton } from '../../Course/ToggleButton';

export function SemesterColumnBody({ highlightedRequirement }: {
  highlightedRequirement: Requirement | undefined;
}) {
  const { schedule } = useChosenSchedule();
  const conflicts = useConflicts(schedule);
  const initialized = useAppSelector(ClassCache.selectInitialized);

  return (
    <div className="h-max flex-1 overflow-auto p-4">
      <div className="flex min-h-[12rem] flex-col items-stretch space-y-4">
        {schedule && (
        <div className="mx-auto">
          <AddCoursesButton schedule={schedule}>
            <FaPlus className="mr-2" />
            Add courses
          </AddCoursesButton>
        </div>
        )}

        {initialized ? schedule && getClassIdsOfSchedule(schedule).map((id) => (
          <CourseCardComponent
            key={id}
            id={id}
            conflicts={conflicts}
            highlightedRequirement={highlightedRequirement}
          />
        )) : (
          <LoadingText />
        )}
      </div>
    </div>
  );
}

function CourseCardComponent({ id, conflicts, highlightedRequirement }: {
  id: string;
  conflicts: Record<string, string[]> | null;
  highlightedRequirement: Requirement | undefined;
}): JSX.Element {
  const { schedule } = useChosenSchedule();
  const profile = useAppSelector(Profile.selectUserProfile);
  const classCache = useAppSelector(ClassCache.selectClassCache);
  const elapsed = useElapsed(3000, []);

  const doHighlight = highlightedRequirement && highlightedRequirement.reducer(
    highlightedRequirement.initialValue || 0,
    classCache[id],
    schedule!,
    profile,
  ) !== null;

  const warnings = ((conflicts?.[id]?.length ?? 0) > 0
    ? `This class conflicts with: ${conflicts![id].map((i) => classCache[i].SUBJECT + classCache[i].CATALOG_NBR).join(', ')}`
    : undefined);

  return id && classCache[id] ? (
    <CourseCard
      key={id}
      course={classCache[id]}
      highlight={doHighlight}
      warnings={warnings}
    />
  ) : (
    <div key={id}>
      {elapsed
        ? (
          <div className="flex items-center justify-between">
            <span>
              Course
              {' '}
              {id.slice(0, 12)}
              ... not found
            </span>
            {schedule && <RemoveCourseButton courseId={id} scheduleId={schedule.id} />}
          </div>
        )
        : 'Loading course data...'}
    </div>
  );
}

