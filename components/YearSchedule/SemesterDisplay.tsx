import React, {
  useMemo, useRef, useState,
} from 'react';
import { FaCheck, FaMinus } from 'react-icons/fa';
import {
  allTruthy,
  checkViable,
  classNames,
  compareSemesters,
  findConflicts,
  getSchedulesBySemester,
} from '../../shared/util';
import { Schedule, Semester, Viability } from '../../shared/types';
import { useAppDispatch, useAppSelector } from '../../src/hooks';
import ScheduleChooser from '../ScheduleSelector';
import CourseCard, { DragStatus } from '../Course/CourseCard';
import FadeTransition from '../FadeTransition';
import { Requirement } from '../../src/requirements/util';
import ButtonMenu from './ButtonMenu';
import { useModal } from '../../src/context/modal';
import {
  ClassCache, Planner, Profile, Schedules, Settings,
} from '../../src/features';
import AddCoursesButton from '../CourseSearchModal';

const VIABILITY_COLORS: Record<Viability, string> = {
  Yes: 'bg-green-200',
  Likely: 'bg-blue-300',
  Unlikely: 'bg-yellow-200',
  No: 'bg-red-300',
};

export interface SemesterDisplayProps {
  semester: Semester;
  chosenScheduleId: string | null;
  highlight?: string;
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
export default function SemesterComponent({
  semester,
  chosenScheduleId,
  highlightedRequirement,
  dragStatus,
  setDragStatus,
  colWidth,
  highlight,
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
    chosenSchedule = schedules[chosenScheduleId];
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

  return (
    <div
      className={classNames(
        'relative md:h-full overflow-hidden transition-colors duration-300',
        dragStatus.dragging
          ? dragStatus.data.originScheduleId === chosenScheduleId
            || !viableDrop
            ? 'bg-gray-300 cursor-not-allowed'
            : VIABILITY_COLORS[viableDrop?.viability]
          : 'odd:bg-gray-300 even:bg-white',
      )}
      style={{ width: `${colWidth}px` }}
    >
      <button
        type="button"
        className="absolute top-2 right-2 text-sm hover:opacity-50"
        onClick={() => {
          if (semesterFormat === 'selected') {
            dispatch(Planner.setHiddenTerm({ term: `${semester.year}${semester.season}`, hidden: true }));
          } else if (chosenScheduleId) {
            dispatch(Planner.setHiddenId({ id: chosenScheduleId, hidden: true }));
          }
        }}
      >
        <FaMinus />
      </button>

      <div
        className="flex flex-col md:h-full"
        onDragOver={(ev) => {
          ev.preventDefault();
          // eslint-disable-next-line no-param-reassign
          ev.dataTransfer.dropEffect = 'move';
        }}
        onDrop={handleDrop}
      >
        <HeaderSection
          chosenScheduleId={chosenScheduleId}
          semester={semester}
          highlight={highlight}
          colWidth={colWidth}
        />

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
          schedule={chosenSchedule}
          highlightedRequirement={highlightedRequirement}
          setDragStatus={setDragStatus}
        />
        )}
      </div>
    </div>
  );
}


type HeaderProps = {
  highlight: string | undefined;
  semester: Semester;
  chosenScheduleId: string | null;
  colWidth: number;
};

function HeaderSection({
  highlight, semester, chosenScheduleId, colWidth,
}: HeaderProps) {
  const dispatch = useAppDispatch();
  const semesterFormat = useAppSelector(Planner.selectSemesterFormat);
  const schedules = useAppSelector(Schedules.selectSchedules);
  const currentSchedules = getSchedulesBySemester(schedules, semester);

  // independent to sync up the transitions nicely
  const [scheduleTitle, setScheduleTitle] = useState<string>();
  const [showSelector, setShowSelector] = useState(true);
  const [editing, setEditing] = useState(false);
  const editRef = useRef<HTMLInputElement>(null!);

  const prevScheduleId = currentSchedules[0]?.title === chosenScheduleId ? null : (currentSchedules[0]?.title || null);

  async function handleRenameSchedule(ev: React.FormEvent) {
    ev.preventDefault();
    if (!chosenScheduleId) {
      alert('no schedule selected to rename');
      return;
    }
    if (!scheduleTitle) {
      alert('invalid title given');
      return;
    }
    await dispatch(Schedules.renameSchedule({ scheduleId: chosenScheduleId, title: scheduleTitle }));
    setEditing(false);
  }

  const doHighlight = typeof highlight !== 'undefined' && highlight === chosenScheduleId;

  const chooseSchedule = (scheduleId: string | null) => dispatch(Settings.chooseSchedule({
    term: `${semester.year}${semester.season}`,
    scheduleId,
  }));

  return (
    <div className="flex flex-col items-stretch space-y-2 border-b-2 border-black p-4">
      {/* only show */}
      {semesterFormat !== 'all' && (
      <h1 className="min-w-max text-center text-lg font-semibold">
        {semester.season}
        {' '}
        {semester.year}
      </h1>
      )}

      <FadeTransition
        show={editing}
        unmount={false}
        beforeEnter={() => setShowSelector(false)}
        afterLeave={() => setShowSelector(true)}
      >
        <form
          className="relative"
          onSubmit={handleRenameSchedule}
        >
          <input
            type="text"
            value={scheduleTitle}
            onChange={({ currentTarget }) => setScheduleTitle(
              currentTarget.value
                .replace(/[^a-zA-Z0-9-_ ]/g, '')
                .slice(0, 30),
            )}
            className="w-full rounded border-2 py-1 pl-2 pr-7 shadow-inner focus:shadow"
            ref={editRef}
          />
          <button
            type="submit"
            className="absolute inset-y-0 right-2 flex items-center"
          >
            <FaCheck />
          </button>
        </form>
      </FadeTransition>

      {semesterFormat !== 'sample' && showSelector && (
      <ScheduleChooser
        scheduleIds={currentSchedules.sort(compareSemesters).map((s) => s.id)}
        chosenScheduleId={chosenScheduleId}
        handleChooseSchedule={chooseSchedule}
        direction="center"
        parentWidth={`${colWidth}px`}
        showTerm={semesterFormat === 'all' ? 'on' : 'auto'}
        highlight={doHighlight}
        showDropdown={semesterFormat !== 'all'}
      />
      )}

      {semesterFormat !== 'sample' && (
      <ButtonMenu
        prevScheduleId={prevScheduleId}
        handleChooseSchedule={chooseSchedule}
        season={semester.season}
        year={semester.year}
        chosenScheduleId={chosenScheduleId}
      />
      )}
    </div>
  );
}


function CoursesSection({ schedule, highlightedRequirement, setDragStatus }: {
  schedule: Schedule;
  highlightedRequirement: Requirement | undefined;
  setDragStatus: React.Dispatch<React.SetStateAction<DragStatus>>;
}) {
  const { showCourse } = useModal();
  const profile = useAppSelector(Profile.selectUserProfile);
  const classCache = useAppSelector(ClassCache.selectClassCache);
  const semesterFormat = useAppSelector(Planner.selectSemesterFormat);
  const conflicts = findConflicts(allTruthy(schedule.classes.map(({ classId }) => classCache[classId])));

  const doHighlight = (id: string) => highlightedRequirement && highlightedRequirement.reducer(
    highlightedRequirement.initialValue || 0,
    classCache[id],
    schedule!,
    profile,
  ) !== null;

  const warnings = (id: string) => ((conflicts[id]?.length || 0) > 0 ? `This class conflicts with: ${conflicts![id].map((i) => classCache[i].SUBJECT + classCache[i].CATALOG_NBR).join(', ')}` : undefined);

  return (
    <div className="h-max flex-1 p-4 md:overflow-auto">
      <div className="flex min-h-[12rem] flex-col items-stretch space-y-4">
        <AddCoursesButton schedule={schedule} />

        {schedule.classes.map(({ classId: id }) => (id && classCache[id] ? (
          <CourseCard
            key={id}
            course={classCache[id]}
            handleExpand={() => showCourse(classCache[id])}
            highlight={doHighlight(id)}
            chosenScheduleId={schedule.id}
            setDragStatus={semesterFormat === 'sample' ? undefined : setDragStatus}
            inSearchContext={false}
            warnings={warnings(id)}
          />
        ) : (
          <div key={id}>Loading course data...</div>
        )))}
      </div>
    </div>
  );
}
