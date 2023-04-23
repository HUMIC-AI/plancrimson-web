import React, { useMemo } from 'react';
import { FaPlus } from 'react-icons/fa';
import { findConflicts, allTruthy } from 'plancrimson-utils';
import { useAppSelector, useElapsed } from '@/src/utils/hooks';
import { Requirement } from '@/src/requirements/util';
import {
  ClassCache, Planner, Profile, Schedules,
} from '@/src/features';
import { Schedule } from '@/src/types';
import AddCoursesButton from '@/components/AddCoursesButton';
import CourseCard, { DragStatus } from '../../Course/CourseCard';

type Props = {
  scheduleId: string;
  highlightedRequirement: Requirement | undefined;
  setDragStatus: React.Dispatch<React.SetStateAction<DragStatus>>;
};

export function CoursesSection({ scheduleId, highlightedRequirement, setDragStatus }: Props) {
  const schedule = useAppSelector(Schedules.selectSchedule(scheduleId));
  const profile = useAppSelector(Profile.selectUserProfile);
  const classCache = useAppSelector(ClassCache.selectClassCache);
  const semesterFormat = useAppSelector(Planner.selectSemesterFormat);
  const conflicts = useMemo(
    () => schedule && findConflicts(allTruthy(schedule.classes.map(({ classId }) => classCache[classId]))),
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
    <div className="group h-max flex-1 p-4 md:overflow-auto">
      <div className="flex min-h-[12rem] flex-col items-stretch space-y-4">
        <AddCoursesButton schedule={schedule}>
          <FaPlus className="mr-2" />
          Add courses
        </AddCoursesButton>

        {schedule.classes.map(({ classId: id }) => (id && classCache[id] ? (
          <CourseCard
            key={id}
            course={classCache[id]}
            highlight={doHighlight(id)}
            chosenScheduleId={schedule.id}
            setDragStatus={semesterFormat === 'sample' ? undefined : setDragStatus}
            inSearchContext={false}
            warnings={warnings(id)}
          />
        ) : (
          <div key={id}>{elapsed ? `Course ${id.slice(0, 12)}... not found` : 'Loading course data...'}</div>
        )))}
      </div>
    </div>
  );
}
