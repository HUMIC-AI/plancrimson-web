import React, {
  useCallback, useMemo, useRef, useState,
} from 'react';
import { FaCheck, FaMinus, FaPlus } from 'react-icons/fa';
import { updateDoc } from 'firebase/firestore';
import Link from 'next/link';
import {
  allTruthy,
  checkViable,
  classNames,
  findConflicts,
  getSchedulesBySemester,
} from '../../shared/util';
import { Season, Viability } from '../../shared/firestoreTypes';
import { getUserRef } from '../../src/hooks';
import ScheduleSelector from '../ScheduleSelector';
import CourseCard, { DragStatus } from '../Course/CourseCard';
import FadeTransition from '../FadeTransition';
import { Requirement } from '../../src/requirements/util';
import ButtonMenu from './ButtonMenu';
import { useAppDispatch, useAppSelector } from '../../src/app/hooks';
import { selectSampleSchedule, selectSemesterFormat } from '../../src/features/semesterFormat';
import {
  addCourse, removeCourses, renameSchedule, selectScheduleData,
} from '../../src/features/schedules';
import { selectClassCache } from '../../src/features/classCache';
import { selectClassYear, selectLastLoggedIn, selectUid } from '../../src/features/userData';
import { useModal } from '../../src/features/modal';

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

function SemesterComponent({
  year,
  season,
  selectedScheduleId,
  selectSchedule,
  highlightedRequirement,
  dragStatus,
  setDragStatus,
  colWidth,
  highlight,
}: Props) {
  const dispatch = useAppDispatch();
  const uid = useAppSelector(selectUid);
  const classYear = useAppSelector(selectClassYear);
  const lastLoggedIn = useAppSelector(selectLastLoggedIn);
  const semesterFormat = useAppSelector(selectSemesterFormat);
  const scheduleData = useAppSelector(selectScheduleData);
  const classCache = useAppSelector(selectClassCache);
  const sampleSchedule = useAppSelector(selectSampleSchedule);
  const { showCourse } = useModal();

  const editRef = useRef<HTMLInputElement>(null!);

  // independent to sync up the transitions nicely
  const [showSelector, setShowSelector] = useState(true);
  const [editing, setEditing] = useState(false);
  const [scheduleTitle, setScheduleTitle] = useState<string>();

  const schedulesBySemester = getSchedulesBySemester(scheduleData.schedules, year, season);
  const selectedSchedule = semesterFormat === 'sample'
    ? sampleSchedule?.schedules.find(
      (schedule) => schedule.id === selectedScheduleId,
    )!
    : selectedScheduleId
      ? scheduleData.schedules[selectedScheduleId]
      : null;

  const conflicts = selectedSchedule
    ? findConflicts(allTruthy(selectedSchedule.classes.map(({ classId }) => classCache[classId])))
    : null;

  const draggedClass = dragStatus.dragging && classCache[dragStatus.data.classId];

  const viableDrop = useMemo(
    () => (draggedClass && selectedSchedule
      ? checkViable(
        draggedClass,
        {
          year: selectedSchedule.year,
          season: selectedSchedule.season,
        },
        { ...scheduleData, classYear, lastLoggedIn },
        classCache,
      )
      : null),
    [classCache, classYear, draggedClass, lastLoggedIn, scheduleData, selectedSchedule],
  );

  function handleMinimize() {
    if (!uid || !selectedSchedule) return;
    const { id, hidden } = selectedSchedule;
    updateDoc(getUserRef(uid), `schedules.${id}.hidden`, !hidden)
      .catch((err) => {
        console.error(err);
        alert('An unexpected error occurred. Please try again.');
      });
  }

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
            dispatch(addCourse([{ classId, scheduleId: selectedScheduleId }]));
            dispatch(removeCourses([{ classId, scheduleId: originScheduleId }]));
          }
        }
      }

      setDragStatus({ dragging: false });
    },
    [dragStatus, selectedScheduleId, viableDrop],
  );

  if (selectedSchedule?.hidden) return null;

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
      <button type="button" className="absolute top-2 right-2 text-sm hover:opacity-50" onClick={handleMinimize}>
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
        {/* First component of display: header */}
        <div className="flex flex-col items-stretch space-y-2 p-4 border-black border-b-2">
          {/* only show */}
          {semesterFormat !== 'all' && (
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
                const { payload } = await dispatch(renameSchedule({ oldId: selectedScheduleId, newId: scheduleTitle }));
                if ('errors' in payload) {
                  console.error(new Error(payload.errors.join(', ')));
                  alert('Oops, couldn\'t rename your schedule. Please try again later.');
                } else {
                  selectSchedule(payload.newId);
                  setEditing(false);
                }
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

          {semesterFormat !== 'sample' && showSelector && (
            <ScheduleSelector
              schedules={schedulesBySemester}
              selectedSchedule={selectedSchedule}
              selectSchedule={(schedule) => schedule && selectSchedule(schedule.id)}
              direction="center"
              parentWidth={`${colWidth}px`}
              showTerm={semesterFormat === 'all'}
              highlight={
                typeof highlight !== 'undefined'
                && highlight === selectedSchedule?.id
              }
            />
          )}

          {semesterFormat !== 'sample' && (
            <ButtonMenu
              prevScheduleId={schedulesBySemester[0]?.id === selectedSchedule?.id ? null : (schedulesBySemester[0]?.id || null)}
              {...{
                season,
                year,
                selectedSchedule,
                selectSchedule,
                setScheduleTitle,
              }}
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
        <div className="flex-1 p-4 md:overflow-auto h-max">
          <div className="flex flex-col items-stretch min-h-[12rem] space-y-4">

            {selectedSchedule
              && (
              <>
                <Link href={{ pathname: '/search', query: { selected: selectedSchedule?.id } }}>
                  {/* eslint-disable-next-line jsx-a11y/anchor-is-valid */}
                  <a className="flex items-center justify-center rounded-xl bg-blue-300 interactive py-2">
                    <FaPlus />
                  </a>
                </Link>

                {selectedSchedule.classes.map(({ classId: id }) => (id && classCache[id] ? (
                  <CourseCard
                    key={id}
                    course={classCache[id]}
                    handleExpand={() => showCourse(classCache[id])}
                    highlight={
                      highlightedRequirement
                      && highlightedRequirement.reducer(
                        highlightedRequirement.initialValue || 0,
                        classCache[id],
                        selectedSchedule!,
                        { ...scheduleData, classYear, lastLoggedIn },
                      ) !== null
                    }
                    selectedSchedule={selectedSchedule}
                    setDragStatus={
                      semesterFormat === 'sample' ? undefined : setDragStatus
                    }
                    inSearchContext={false}
                    warnings={(conflicts?.[id]?.length || 0) > 0 ? `This class conflicts with: ${conflicts![id].map((i) => classCache[i].SUBJECT + classCache[i].CATALOG_NBR).join(', ')}` : undefined}
                  />
                ) : (
                  <div key={id}>Loading course data...</div>
                )))}
              </>
              )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default SemesterComponent;
