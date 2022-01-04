import Link from 'next/link';
import React, { useMemo, useRef, useState } from 'react';
import {
  FaCalendarWeek,
  FaCheck,
  FaClone,
  FaDownload,
  FaPencilAlt,
  FaPlus,
  FaSearch,
  FaTimes,
  FaTrash,
} from 'react-icons/fa';
import {
  checkViable,
  classNames,
  getSchedulesBySemester,
} from '../../shared/util';
import useUserData from '../../src/context/userData';
import { Schedule, Season, UserClassData } from '../../shared/firestoreTypes';
import { useCourseDialog } from '../../src/hooks';
import ScheduleSelector from '../ScheduleSelector';
import CourseCard, { DragStatus } from '../Course/CourseCard';
import CourseDialog from '../Course/CourseDialog';
import useClassCache from '../../src/context/classCache';
import FadeTransition from '../FadeTransition';
import { Viability } from '../../shared/apiTypes';
import { Requirement } from '../../src/requirements/util';

type Props = {
  selectedScheduleId: string | null;
  selectSchedule: React.Dispatch<string>;

  year: number;
  season: Season;

  highlightedRequirement: Requirement | undefined;
  dragStatus: DragStatus;
  setDragStatus: React.Dispatch<React.SetStateAction<DragStatus>>;

  colWidth: number;
};

const VIABILITY_COLORS: Record<Viability, string> = {
  Yes: 'bg-green-200',
  Likely: 'bg-blue-300',
  Unlikely: 'bg-yellow-200',
  No: 'bg-red-300',
};

const SemesterDisplay: React.FC<Props> = function ({
  year,
  season,
  selectedScheduleId,
  selectSchedule,
  highlightedRequirement,
  dragStatus,
  setDragStatus,
  colWidth,
}) {
  const {
    data,
    addCourses,
    removeCourses,
    createSchedule,
    renameSchedule,
    deleteSchedule,
  } = useUserData();
  const {
    closeModal, handleExpand, isOpen, openedCourse,
  } = useCourseDialog();
  const getClass = useClassCache(data);

  const editRef = useRef<HTMLInputElement>(null!);
  const downloadRef = useRef<HTMLAnchorElement>(null!);
  // independent to sync up the transitions nicely
  const [showSelector, setShowSelector] = useState(true);
  const [editing, setEditing] = useState(false);
  const [scheduleTitle, setScheduleTitle] = useState<string>();

  const schedules = getSchedulesBySemester(data, year, season);
  const selectedSchedule = selectedScheduleId
    ? data.schedules[selectedScheduleId]
    : null;

  const draggedClass = dragStatus.dragging && getClass(dragStatus.data.classId);

  const viableDrop = useMemo(
    () => (draggedClass && selectedSchedule
      ? checkViable(
        draggedClass,
        {
          year: selectedSchedule.year,
          season: selectedSchedule.season,
        },
        data,
      )
      : null),
    [data, draggedClass, selectedSchedule],
  );

  async function createNewSchedule(
    title: string,
    // eslint-disable-next-line @typescript-eslint/no-shadow
    year: number,
    // eslint-disable-next-line @typescript-eslint/no-shadow
    season: Season,
    classes: UserClassData[],
    i: number = 0,
  ): Promise<Schedule> {
    try {
      const newSchedule = await createSchedule(
        `${title}${i ? ` ${i}` : ''}`,
        year,
        season,
        classes,
      );
      return newSchedule;
    } catch (err: any) {
      if (err.message === 'id taken') {
        console.error("Couldn't create schedule, retrying");
        const newSchedule = await createNewSchedule(
          title,
          year,
          season,
          classes,
          i + 1,
        );
        return newSchedule;
      }
      throw err;
    }
  }

  const buttonStyles = 'p-1 rounded bg-black bg-opacity-0 hover:text-black hover:bg-opacity-50 transition-colors';

  return (
    <div
      className={classNames(
        'relative md:h-full overflow-y-hidden overflow-x-visible',
        dragStatus.dragging
          ? dragStatus.data.originScheduleId === selectedScheduleId
            || !viableDrop
            ? 'bg-gray-300 cursor-not-allowed'
            : VIABILITY_COLORS[viableDrop?.viability]
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

          if (dragStatus.dragging && selectedScheduleId && viableDrop) {
            if (viableDrop.viability === 'No') {
              alert(viableDrop.reason);
            } else if (
              selectedScheduleId !== dragStatus.data.originScheduleId
            ) {
              const doAdd = viableDrop.viability !== 'Unlikely'
                // eslint-disable-next-line no-restricted-globals
                || confirm(`${viableDrop.reason} Continue anyways?`);
              if (doAdd) {
                const { classId, originScheduleId } = dragStatus.data;
                addCourses({ classId, scheduleId: selectedScheduleId });
                removeCourses({ classId, scheduleId: originScheduleId });
              }
            }
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

          <FadeTransition
            show={editing}
            unmount={false}
            beforeEnter={() => setShowSelector(false)}
            afterLeave={() => setShowSelector(true)}
          >
            <form
              className="relative"
              // eslint-disable-next-line consistent-return
              onSubmit={async (ev) => {
                ev.preventDefault();
                if (!selectedScheduleId) {
                  return alert('no schedule selected to rename');
                }
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
                onChange={({ currentTarget }) => setScheduleTitle(
                  currentTarget.value.replace(/[^a-zA-Z0-9-_ ]/g, '').slice(0, 20),
                )}
                className="w-full py-1 px-2 rounded focus:shadow shadow-inner border-2"
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

          {showSelector && (
            <ScheduleSelector
              schedules={schedules}
              selectedSchedule={selectedSchedule}
              selectSchedule={(schedule) => schedule && selectSchedule(schedule.id)}
              direction="center"
            />
          )}

          <div className="flex mx-auto justify-center items-center flex-wrap max-w-[8rem] gap-2 mt-2 text-gray-600 text-xs">
            {selectedSchedule && (
              <>
                <Link
                  href={{
                    pathname: '/',
                    query: { selected: selectedSchedule.id },
                  }}
                >
                  {/* eslint-disable-next-line jsx-a11y/anchor-is-valid */}
                  <a className={buttonStyles}>
                    <FaSearch />
                  </a>
                </Link>
                <Link
                  href={{
                    pathname: '/semester',
                    query: { selected: selectedSchedule.id },
                  }}
                >
                  {/* eslint-disable-next-line jsx-a11y/anchor-is-valid */}
                  <a className={buttonStyles}>
                    <FaCalendarWeek />
                  </a>
                </Link>
                <button
                  type="button"
                  onClick={() => createNewSchedule(
                    `${selectedSchedule.id} copy`,
                    selectedSchedule.year,
                    selectedSchedule.season,
                    selectedSchedule.classes,
                  )
                    .then((schedule) => selectSchedule(schedule.id))
                    .catch((err) => {
                      console.error(err);
                      alert(
                        "Couldn't duplicate your schedule. Please try again later.",
                      );
                    })}
                  className={buttonStyles}
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
                  className={buttonStyles}
                >
                  {editing ? <FaTimes /> : <FaPencilAlt />}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    createNewSchedule(`${season} ${year}`, year, season, [])
                      .then((schedule) => selectSchedule(schedule.id))
                      .catch((err) => {
                        console.error(err);
                        alert("Couldn't create a new schedule!");
                      });
                  }}
                  className={buttonStyles}
                >
                  <FaPlus title="Add schedule" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    // eslint-disable-next-line no-restricted-globals
                    const confirmDelete = confirm(
                      `Are you sure you want to delete your schedule ${selectedSchedule.id}?`,
                    );
                    if (confirmDelete) {
                      deleteSchedule(selectedSchedule.id)
                        .then(() => selectSchedule(schedules[0].id))
                        .catch((err) => alert(
                          `There was a problem deleting your schedule: ${err.message}`,
                        ));
                    }
                  }}
                  className={buttonStyles}
                >
                  <FaTrash />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    downloadRef.current.setAttribute(
                      'href',
                      `data:text/json;charset=utf-8,${encodeURIComponent(
                        JSON.stringify(selectedSchedule, null, 2),
                      )}`,
                    );
                    downloadRef.current.click();
                  }}
                  className={buttonStyles}
                >
                  <FaDownload />
                  {/* eslint-disable-next-line jsx-a11y/anchor-has-content, jsx-a11y/anchor-is-valid */}
                  <a
                    className="hidden"
                    ref={downloadRef}
                    download={`${selectedSchedule.id} (Plan Crimson).json`}
                  />
                </button>
              </>
            )}
          </div>
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
            {selectedSchedule
              && selectedSchedule.classes.map(({ classId: id }) => (id && getClass(id) ? (
                <CourseCard
                  key={id}
                  course={getClass(id)!}
                  handleExpand={handleExpand}
                  highlight={
                      highlightedRequirement
                      && highlightedRequirement.reducer(
                        highlightedRequirement.initialValue || 0,
                        getClass(id)!,
                        selectedSchedule!,
                        data,
                      ) !== null
                    }
                  selectedSchedule={selectedSchedule}
                  setDragStatus={setDragStatus}
                  inSearchContext={false}
                />
              ) : (
                <div key={id}>
                  Could not load data for
                  {id}
                </div>
              )))}
          </div>
        </div>
      </div>

      <CourseDialog
        isOpen={isOpen}
        closeModal={closeModal}
        course={openedCourse}
      />
    </div>
  );
};

export default SemesterDisplay;
