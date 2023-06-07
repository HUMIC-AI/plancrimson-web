import React from 'react';
import { Requirement } from '@/src/requirements/util';
import type { Schedule, ScheduleIdOrSemester, Viability } from '@/src/types';
import { classNames } from '@/src/utils/styles';
import { Season, semesterToTerm } from '@/src/lib';
import { isScheduleId } from '@/src/utils/schedules';
import SemesterColumnHeader from './SemesterColumnHeader';
import { CoursesSection } from './CoursesSection';
import { useDragAndDropContext } from './DragAndDrop';
import { useScheduleFromScheduleIdOrSemester } from './useScheduleFromScheduleIdOrSemester';

const VIABILITY_COLORS: Record<Viability, string> = {
  Yes: 'bg-green',
  Likely: 'bg-blue-light',
  Unlikely: 'bg-yellow',
  No: 'bg-red',
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
  const drag = useDragAndDropContext();
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
        className="flex flex-col md:h-full"
        onDragOver={drag.enabled ? (ev) => {
          ev.preventDefault();
          ev.dataTransfer.dropEffect = 'move';
        } : undefined}
        onDrop={drag.enabled && schedule ? (ev) => {
          ev.preventDefault();
          drag.handleDrop(schedule.id, semester && semesterToTerm(semester));
        } : undefined}
      >
        <SemesterColumnHeader s={s} />

        {schedule && (
        <CoursesSection
          scheduleId={schedule.id}
          highlightedRequirement={highlightedRequirement}
        />
        )}
      </div>
    </div>
  );
}


function useStylesForSchedule(schedule: Schedule | null, season: Season | null) {
  const drag = useDragAndDropContext();

  if (drag.enabled && drag.dragStatus.dragging) {
    const validDrop = schedule && drag.dragStatus.data.originScheduleId !== schedule.id && drag.checkViableDrop(schedule.id);

    if (!validDrop) {
      return 'bg-gray-light cursor-not-allowed';
    }

    return VIABILITY_COLORS[validDrop.viability];
  }

  return season === 'Fall'
    ? 'bg-season-fall'
    : season === 'Spring'
      ? 'bg-season-spring'
      : 'bg-gray-light';
}

