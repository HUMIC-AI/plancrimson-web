import React from 'react';
import {
  Season,
  Semester,
} from '@/src/lib';
import { Requirement } from '@/src/requirements/util';
import { Viability } from '@/src/types';
import { classNames } from '@/src/utils/styles';
import HeaderSection from './SemesterColumnHeader';
import { CoursesSection } from './CoursesSection';
import { useDragAndDropContext } from './DragAndDrop';

const VIABILITY_COLORS: Record<Viability, string> = {
  Yes: 'bg-green',
  Likely: 'bg-blue-light',
  Unlikely: 'bg-yellow',
  No: 'bg-red',
};

export interface SemesterDisplayProps {
  semester: Semester;
  chosenScheduleId: string | null;
}

interface SemesterComponentProps extends SemesterDisplayProps {
  highlightedRequirement: Requirement | undefined;
  colWidth: number;
}

/**
 * A column in the {@link PlanningSection} that represents a semester.
 * Renders a schedule chooser and the classes in the chosen schedule.
 * @param semester the semester to render
 * @param chosenScheduleId the ID of the currently selected schedule
 * @param chooseSchedule the callback for when a schedule is chosen
 * @param highlightedRequirement highlight any courses that satisfy this requirement
 * @param highlight highlight this semester
 */
export default function SemesterColumn({
  semester,
  chosenScheduleId,
  highlightedRequirement,
  colWidth,
}: SemesterComponentProps) {
  const colorStyles = useStyles(semester.season, chosenScheduleId);
  const drag = useDragAndDropContext();

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
          // eslint-disable-next-line no-param-reassign
          ev.dataTransfer.dropEffect = 'move';
        } : undefined}
        onDrop={drag.enabled && chosenScheduleId ? (ev) => {
          ev.preventDefault();
          drag.handleDrop(chosenScheduleId);
        } : undefined}
      >
        <HeaderSection semester={`${semester.year}${semester.season}`} />

        {/* {selectedSchedule.classes.length > 0 && (
        <p className="text-sm">
          Expected hours per week:
          <br />
          {selectedSchedule.classes.map(({ classId }) => getClass(classId)?.meanHours?.toFixed(2) || '?').join(' + ')}
          <br />
          {' = '}
          {selectedSchedule.classes.reduce((acc, { classId }) => acc + (getClass(classId)?.meanHours || 0), 0).toFixed(2)}
          {selectedSchedule.classes.find(({ classId }) => !getClass(classId)?.meanHours) && ' + ?'}
        </p>
        )} */}

        {chosenScheduleId && (
        <CoursesSection
          scheduleId={chosenScheduleId}
          highlightedRequirement={highlightedRequirement}
        />
        )}
      </div>
    </div>
  );
}


// // the schedules for this semester to show
// let chosenSchedule: Schedule | null = null;
// if (semesterFormat === 'sample') {
//   chosenSchedule = sampleSchedule!.schedules.find((schedule) => schedule.id === chosenScheduleId)!;
// } else if (chosenScheduleId) {
//   chosenSchedule = schedules[chosenScheduleId] ?? null;
// }

function useStyles(season: Season, scheduleId: string | null) {
  const drag = useDragAndDropContext();

  const backgroundColor = season === 'Fall'
    ? 'bg-season-fall'
    : season === 'Spring'
      ? 'bg-season-spring'
      : 'bg-gray-light';

  if (!drag.enabled || !drag.dragStatus.dragging || !scheduleId) {
    return backgroundColor;
  }

  const validDrop = drag.dragStatus.data.originScheduleId !== scheduleId && drag.checkViableDrop(scheduleId);

  if (!validDrop) {
    return 'bg-gray-light cursor-not-allowed';
  }

  return VIABILITY_COLORS[validDrop.viability];
}
