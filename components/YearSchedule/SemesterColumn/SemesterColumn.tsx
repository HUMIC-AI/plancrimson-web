import React from 'react';
import { Requirement } from '@/src/requirements/util';
import type { BaseSchedule, ScheduleIdOrSemester, Viability } from '@/src/types';
import { classNames } from '@/src/utils/styles';
import { Season, semesterToTerm } from '@/src/lib';
import { isScheduleId } from '@/src/utils/schedules';
import SemesterColumnHeader from './SemesterColumnHeader';
import { SemesterColumnBody } from './CoursesSection';
import { useCourseDragContext } from '../../../src/context/DragCourseMoveSchedulesProvider';
import { useScheduleFromScheduleIdOrSemester } from './useScheduleFromScheduleIdOrSemester';
import { ScheduleIdProvider } from '../../../src/context/selectedSchedule';
import { checkViable } from '../../../src/searchSchedule';
import { useAppSelector } from '../../../src/utils/hooks';
import { ClassCache, Profile } from '../../../src/features';

const VIABILITY_COLORS: Record<Viability, string> = {
  Yes: 'bg-blue-primary',
  Likely: 'bg-blue-secondary',
  Unlikely: 'bg-gray-secondary',
  No: 'bg-gray-secondary',
};

type Props = {
  s: ScheduleIdOrSemester;
  highlightedRequirement?: Requirement;
  colWidth: number;
};

/**
 * A column in the PlanningSection that represents a semester.
 * Renders a schedule chooser and the classes in the chosen schedule.
 */
export default function SemesterColumn({
  s,
  highlightedRequirement,
  colWidth,
}: Props) {
  const drag = useCourseDragContext();
  const { schedule, semester } = useScheduleFromScheduleIdOrSemester(s);
  const colorStyles = useStylesForSchedule(schedule, isScheduleId(s) ? (schedule ? schedule.season : null) : s.season);

  return (
    <div
      className={classNames(
        'relative md:h-full overflow-hidden transition-colors duration-300',
        colorStyles,
      )}
      style={{ width: `${colWidth}px` }}
    >
      <div
        className="absolute inset-0 flex flex-col"
        onDragOver={drag ? (ev) => {
          ev.preventDefault();
          ev.dataTransfer.dropEffect = 'move';
        } : undefined}
        onDrop={drag && schedule ? (ev) => {
          ev.preventDefault();
          drag.handleDrop({ targetSchedule: schedule, term: semester && semesterToTerm(semester) });
        } : undefined}
      >
        <SemesterColumnHeader s={s} />

        {schedule && (
          <ScheduleIdProvider id={schedule.id}>
            <SemesterColumnBody
              highlightedRequirement={highlightedRequirement}
            />
          </ScheduleIdProvider>
        )}
      </div>
    </div>
  );
}


function useStylesForSchedule(schedule: BaseSchedule | null, season: Season | null) {
  const drag = useCourseDragContext();
  const profile = useAppSelector(Profile.selectUserProfile);
  const classCache = useAppSelector(ClassCache.selectClassCache);

  if (drag && drag.dragStatus.dragging) {
    const validDrop = schedule && drag.dragStatus.data.originScheduleId !== schedule.id && checkViable({
      cls: classCache[drag.dragStatus.data.classId],
      classCache,
      schedule,
      classYear: profile.classYear!,
    });

    if (!validDrop) {
      return 'bg-gray-light cursor-not-allowed';
    }

    return VIABILITY_COLORS[validDrop.viability];
  }

  return season === 'Fall'
    ? 'bg-gray-secondary/40'
    : season === 'Spring'
      ? 'bg-blue-secondary/40'
      : 'bg-gray-secondary';
}

