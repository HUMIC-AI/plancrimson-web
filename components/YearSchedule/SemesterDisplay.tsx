import Link from 'next/link';
import React, { useRef, useState } from 'react';
import {
  FaCalendarWeek, FaCheck, FaClone, FaEdit, FaSearch, FaTimes, FaTrash,
} from 'react-icons/fa';
import {
  checkViable, classNames, getSchedulesBySemester,
} from '../../shared/util';
import useUserData from '../../src/context/userData';
import { Schedule, Season } from '../../shared/firestoreTypes';
import { useCourseDialog } from '../../src/hooks';
import ScheduleSelector from '../ScheduleSelector';
import CourseCard, { DragStatus } from '../Course/CourseCard';
import CourseDialog from '../Course/CourseDialog';
import useClassCache from '../../src/context/classCache';
import FadeTransition from '../FadeTransition';

type Props = {
  selectedScheduleId: string | null;
  selectSchedule: React.Dispatch<string>;

  year: number;
  season: Season;

  highlightedClasses: string[];
  dragStatus: DragStatus;
  setDragStatus: React.Dispatch<React.SetStateAction<DragStatus>>;

  colWidth: number;
};

const SemesterDisplay: React.FC<Props> = function ({
  year, season, selectedScheduleId, selectSchedule, highlightedClasses, dragStatus, setDragStatus, colWidth,
}) {
  const {
    data, addCourses, removeCourses, createSchedule, renameSchedule, deleteSchedule,
  } = useUserData();
  const {
    closeModal, handleExpand, isOpen, openedCourse,
  } = useCourseDialog();
  const getClass = useClassCache(data);

  const editRef = useRef<HTMLInputElement>(null!);
  // independent to sync up the transitions nicely
  const [showSelector, setShowSelector] = useState(true);
  const [editing, setEditing] = useState(false);
  const [scheduleTitle, setScheduleTitle] = useState<string>();

  const schedules = getSchedulesBySemester(data, year, season);
  const selectedSchedule = selectedScheduleId ? data.schedules[selectedScheduleId] : null;

  const draggedClass = dragStatus.dragging && getClass(dragStatus.data.classId);
  const viableDrop = draggedClass && selectedSchedule && checkViable(draggedClass, {
    year: selectedSchedule.year,
    season: selectedSchedule.season,
  });

  function copySchedule(schedule: Schedule, i: number = 0) {
    createSchedule(
      `${schedule.id} copy${i ? ` ${i}` : ''}`,
      schedule.year,
      schedule.season,
      schedule.classes,
    )
      .then((newSchedule) => selectSchedule(newSchedule.id))
      .catch((err) => {
        if (err.message === 'id taken') copySchedule(schedule, i + 1);
        else alert(`Couldn't create your schedule: ${err.message}`);
      });
  }

  return (
    <div
      className={classNames(
        'relative md:h-full overflow-y-hidden overflow-x-visible',
        dragStatus.dragging
          ? (dragStatus.data.originScheduleId === selectedScheduleId
            ? 'bg-gray-300 cursor-not-allowed'
            : (viableDrop ? 'bg-blue-300' : 'bg-yellow-300'))
          : 'odd:bg-gray-300 even:bg-white',
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
        onDrop={(ev) => {
          ev.preventDefault();
          if (selectedScheduleId && dragStatus.dragging && selectedScheduleId !== dragStatus.data.originScheduleId) {
            const { classId, originScheduleId } = dragStatus.data;
            if (selectedScheduleId === originScheduleId) return;
            addCourses({ classId, scheduleId: selectedScheduleId });
            removeCourses({ classId, scheduleId: originScheduleId });
          }
          setDragStatus({ dragging: false });
        }}
      >
        {/* First component of display */}
        <div className="flex flex-col items-stretch gap-2 p-4 border-black border-b-2">
          <h1 className="text-lg text-center min-w-max font-semibold">
            {year}
            {' '}
            {season}
          </h1>

          <FadeTransition show={editing} unmount={false} beforeEnter={() => setShowSelector(false)} afterLeave={() => setShowSelector(true)}>
            <form
              className="relative"
              // eslint-disable-next-line consistent-return
              onSubmit={async (ev) => {
                ev.preventDefault();
                if (!selectedScheduleId) return alert('no schedule selected to rename');
                if (!scheduleTitle) return alert('invalid title given');
                renameSchedule(selectedScheduleId, scheduleTitle)
                  .then((schedule) => {
                    selectSchedule(schedule.id);
                    setEditing(false);
                  })
                  .catch((err) => alert(`Oops, couldn't rename your schedule: ${err.message}`));
              }}
            >
              <input
                type="text"
                value={scheduleTitle}
                onChange={({ currentTarget }) => setScheduleTitle(currentTarget.value)}
                className="w-full py-1 px-2 rounded focus:shadow shadow-inner border-2"
                ref={editRef}
              />
              <button type="submit" className="absolute inset-y-0 right-2 flex items-center">
                <FaCheck />
              </button>
            </form>
          </FadeTransition>

          {showSelector && (
            <ScheduleSelector
              schedules={schedules}
              selectedSchedule={selectedSchedule}
              selectSchedule={(schedule) => selectSchedule(schedule.id)}
              direction="center"
            />
          )}

          {selectedSchedule && (
            <div className="flex justify-center items-center gap-2 mt-2 text-gray-500 text-xs">
              <Link href={{
                pathname: '/semester',
                query: { selected: selectedSchedule.id },
              }}
              >
                {/* eslint-disable-next-line jsx-a11y/anchor-is-valid */}
                <a className="p-1 rounded bg-black bg-opacity-0 hover:text-black transition-colors">
                  <FaCalendarWeek />
                </a>
              </Link>
              <Link href={{
                pathname: '/',
                query: { selected: selectedSchedule.id },
              }}
              >
                {/* eslint-disable-next-line jsx-a11y/anchor-is-valid */}
                <a className="p-1 rounded bg-black bg-opacity-0 hover:text-black transition-colors">
                  <FaSearch />
                </a>
              </Link>
              <button
                type="button"
                onClick={() => copySchedule(selectedSchedule)}
                className="p-1 rounded bg-black bg-opacity-0 hover:text-black transition-colors"
              >
                <FaClone />
              </button>
              <button
                type="button"
                onClick={async () => {
                  if (editing) setEditing(false);
                  else {
                    setScheduleTitle(selectedSchedule.id);
                    setEditing(true);
                    process.nextTick(() => editRef.current.focus());
                  }
                }}
                className="p-1 rounded bg-black bg-opacity-0 hover:text-black transition-colors"
              >
                {editing ? <FaTimes /> : <FaEdit />}
              </button>
              <button
                type="button"
                onClick={() => {
                  // eslint-disable-next-line no-restricted-globals
                  const confirmDelete = confirm(`Are you sure you want to delete your schedule ${selectedSchedule.id}?`);
                  if (confirmDelete) {
                    deleteSchedule(selectedSchedule.id)
                      .then(() => selectSchedule(schedules[0].id))
                      .catch((err) => alert(`There was a problem deleting your schedule: ${err.message}`));
                  }
                }}
              >
                <FaTrash />
              </button>
            </div>
          )}
        </div>

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

        {/* Second component: actual classes */}
        <div className="flex-1 p-4 md:overflow-auto">
          <div className="flex flex-col items-stretch gap-4">
            {selectedSchedule && selectedSchedule.classes.map(({ classId: id }) => (
              id && getClass(id)
                ? (
                  <CourseCard
                    key={id}
                    course={getClass(id)!}
                    handleExpand={handleExpand}
                    highlight={highlightedClasses.includes(id)}
                    selectedSchedule={selectedSchedule}
                    setDragStatus={setDragStatus}
                    inSearchContext={false}
                  />
                )
                : (
                  <div key={id}>
                    Could not load data for
                    {' '}
                    {id}
                  </div>
                )))}
          </div>
        </div>
      </div>

      <CourseDialog isOpen={isOpen} closeModal={closeModal} course={openedCourse} />
    </div>
  );
};

export default SemesterDisplay;
