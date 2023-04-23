import React, {
  useMemo,
} from 'react';
import {
  Semester,
} from 'plancrimson-utils';
import { useAppDispatch, useAppSelector } from '@/src/utils/hooks';
import { Requirement } from '@/src/requirements/util';
import {
  ClassCache, Planner, Profile, Schedules,
} from '@/src/features';
import { checkViable } from '@/src/searchSchedule';
import { Viability, Schedule } from '@/src/types';
import { classNames } from '@/src/utils/styles';
import { DragStatus } from '../../Course/CourseCard';
import HeaderSection from './SemesterColumnHeader';
import { CoursesSection } from './CoursesSection';

const VIABILITY_COLORS: Record<Viability, string> = {
  Yes: 'bg-green-300',
  Likely: 'bg-blue-light',
  Unlikely: 'bg-yellow-200',
  No: 'bg-red-300',
};

export interface SemesterDisplayProps {
  semester: Semester;
  chosenScheduleId: string | null;
}

interface SemesterComponentProps extends SemesterDisplayProps {
  highlightedRequirement: Requirement | undefined;
  dragStatus: DragStatus;
  setDragStatus: React.Dispatch<React.SetStateAction<DragStatus>>;
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
  dragStatus,
  setDragStatus,
  colWidth,
}: SemesterComponentProps) {
  const dispatch = useAppDispatch();
  const profile = useAppSelector(Profile.selectUserProfile);
  const semesterFormat = useAppSelector(Planner.selectSemesterFormat);
  const sampleSchedule = useAppSelector(Planner.selectSampleSchedule);
  const schedules = useAppSelector(Schedules.selectSchedules);
  const classCache = useAppSelector(ClassCache.selectClassCache);

  // the schedules for this semester to show
  let chosenSchedule: Schedule | null = null;
  if (semesterFormat === 'sample') {
    chosenSchedule = sampleSchedule!.schedules.find((schedule) => schedule.id === chosenScheduleId)!;
  } else if (chosenScheduleId) {
    chosenSchedule = schedules[chosenScheduleId] ?? null;
  }

  const draggedClass = dragStatus.dragging && classCache[dragStatus.data.classId];

  const viableDrop = useMemo(
    () => (profile.classYear && draggedClass && chosenSchedule
      ? checkViable({
        cls: draggedClass,
        schedule: chosenSchedule,
        classYear: profile.classYear,
        classCache,
      })
      : null),
    [classCache, profile, draggedClass, chosenSchedule],
  );

  function handleDrop(ev: React.DragEvent<HTMLDivElement>) {
    ev.preventDefault();

    setDragStatus({ dragging: false });

    if (!dragStatus.dragging || !chosenScheduleId || !viableDrop) return;

    if (viableDrop.viability === 'No') {
      alert(viableDrop.reason);
    } else if (chosenScheduleId !== dragStatus.data.originScheduleId) {
      const doAdd = viableDrop.viability !== 'Unlikely' || confirm(`${viableDrop.reason} Continue anyways?`);
      if (doAdd) {
        const { classId, originScheduleId } = dragStatus.data;
        dispatch(Schedules.addCourses({ scheduleId: chosenScheduleId, courses: [{ classId }] }));
        dispatch(Schedules.removeCourses({ scheduleId: originScheduleId, courseIds: [classId] }));
      }
    }
  }

  const backgroundColor = semester.season === 'Fall'
    ? 'bg-season-fall'
    : semester.season === 'Spring'
      ? 'bg-season-spring' : 'bg-gray-light';

  return (
    <div
      className={classNames(
        'relative md:h-full overflow-hidden transition-colors duration-300',
        dragStatus.dragging
          ? dragStatus.data.originScheduleId === chosenScheduleId
            || !viableDrop
            ? 'bg-gray-light cursor-not-allowed'
            : VIABILITY_COLORS[viableDrop?.viability]
          : backgroundColor,
      )}
      style={{ width: `${colWidth}px` }}
    >
      <div
        className="flex flex-col md:h-full"
        onDragOver={(ev) => {
          ev.preventDefault();
          // eslint-disable-next-line no-param-reassign
          ev.dataTransfer.dropEffect = 'move';
        }}
        onDrop={handleDrop}
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

        {chosenSchedule && (
        <CoursesSection
          scheduleId={chosenScheduleId}
          highlightedRequirement={highlightedRequirement}
          setDragStatus={setDragStatus}
        />
        )}
      </div>
    </div>
  );
}


