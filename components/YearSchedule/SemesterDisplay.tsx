import React, {
  useCallback, useMemo, useRef, useState,
} from 'react';
import { FaCheck } from 'react-icons/fa';
import {
  allTruthy,
  checkViable,
  classNames,
  getSchedulesBySemester,
} from '../../shared/util';
import useUserData from '../../src/context/userData';
import { Season } from '../../shared/firestoreTypes';
import { useCourseDialog } from '../../src/hooks';
import ScheduleSelector from '../ScheduleSelector';
import CourseCard, { DragStatus } from '../Course/CourseCard';
import CourseDialog from '../Course/CourseDialog';
import useClassCache, { ClassCache } from '../../src/context/classCache';
import FadeTransition from '../FadeTransition';
import { Viability } from '../../shared/apiTypes';
import { Requirement } from '../../src/requirements/util';
import ButtonMenu from './ButtonMenu';
import useShowAllSchedules from '../../src/context/showAllSchedules';

type Props = {
  selectedScheduleId: string | null;
  selectSchedule: React.Dispatch<string | null>;

  year: number;
  season: Season;

  highlightedRequirement: Requirement | undefined;
  highlight?: string;
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
  highlight,
}) {
  const {
    data, addCourses, removeCourses, renameSchedule,
  } = useUserData();
  const {
    closeModal, handleExpand, isOpen, openedCourse,
  } = useCourseDialog();
  const { showAllSchedules, sampleSchedule } = useShowAllSchedules();

  const editRef = useRef<HTMLInputElement>(null!);

  // independent to sync up the transitions nicely
  const [showSelector, setShowSelector] = useState(true);
  const [editing, setEditing] = useState(false);
  const [scheduleTitle, setScheduleTitle] = useState<string>();

  const schedules = getSchedulesBySemester(data, year, season);
  const selectedSchedule = showAllSchedules === 'sample'
    ? sampleSchedule?.schedules.find(
      (schedule) => schedule.id === selectedScheduleId,
    )!
    : selectedScheduleId
      ? data.schedules[selectedScheduleId]
      : null;

  const classCache: Readonly<ClassCache> = useClassCache(
    allTruthy([selectedSchedule]),
  );

  const draggedClass = dragStatus.dragging && classCache[dragStatus.data.classId];

  const viableDrop = useMemo(
    () => (draggedClass && selectedSchedule
      ? checkViable(
        draggedClass,
        {
          year: selectedSchedule.year,
          season: selectedSchedule.season,
        },
        data,
        classCache,
      )
      : null),
    [classCache, data, draggedClass, selectedSchedule],
  );

  const handleDrop: React.DragEventHandler<HTMLDivElement> = useCallback(
    (ev) => {
      ev.preventDefault();

      if (dragStatus.dragging && selectedScheduleId && viableDrop) {
        if (viableDrop.viability === 'No') {
          alert(viableDrop.reason);
        } else if (selectedScheduleId !== dragStatus.data.originScheduleId) {
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
    },
    [
      addCourses,
      dragStatus,
      removeCourses,
      selectedScheduleId,
      setDragStatus,
      viableDrop,
    ],
  );

  return (
    <div
      className={classNames(
        'relative md:h-full overflow-hidden transition-colors duration-300',
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
        onDrop={handleDrop}
      >
        {/* First component of display */}
        <div className="flex flex-col items-stretch space-y-2 p-4 border-black border-b-2">
          {/* only show */}
          {showAllSchedules !== 'all' && (
            <h1 className="text-lg text-center min-w-max font-semibold">
              {season}
              {' '}
              {year}
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
                  currentTarget.value
                    .replace(/[^a-zA-Z0-9-_ ]/g, '')
                    .slice(0, 30),
                )}
                className="w-full py-1 pl-2 pr-7 rounded focus:shadow shadow-inner border-2"
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

          {showAllSchedules !== 'sample' && showSelector && (
            <ScheduleSelector
              schedules={schedules}
              selectedSchedule={selectedSchedule}
              selectSchedule={(schedule) => schedule && selectSchedule(schedule.id)}
              direction="center"
              parentWidth={`${colWidth}px`}
              showTerm={showAllSchedules === 'all'}
              highlight={
                typeof highlight !== 'undefined'
                && highlight === selectedSchedule?.id
              }
            />
          )}

          {showAllSchedules !== 'sample' && (
            <ButtonMenu
              editing={editing}
              prevScheduleId={schedules[0]?.id || null}
              season={season}
              year={year}
              selectSchedule={selectSchedule}
              selectedSchedule={selectedSchedule}
              setEditing={setEditing}
              focusInput={() => editRef.current.focus()}
              setScheduleTitle={setScheduleTitle}
            />
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
          <div className="flex flex-col items-stretch space-y-4">
            {selectedSchedule
              && selectedSchedule.classes.map(({ classId: id }) => (id && classCache[id] ? (
                <CourseCard
                  key={id}
                  course={classCache[id]}
                  handleExpand={handleExpand}
                  highlight={
                      highlightedRequirement
                      && highlightedRequirement.reducer(
                        highlightedRequirement.initialValue || 0,
                        classCache[id],
                        selectedSchedule!,
                        data,
                      ) !== null
                    }
                  selectedSchedule={selectedSchedule}
                  setDragStatus={
                      showAllSchedules === 'sample' ? undefined : setDragStatus
                    }
                  inSearchContext={false}
                />
              ) : (
                <div key={id}>Loading course data...</div>
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
