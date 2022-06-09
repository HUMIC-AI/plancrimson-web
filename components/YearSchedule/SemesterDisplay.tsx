import React, {
  useCallback, useMemo, useRef, useState,
} from 'react';
import { FaCheck, FaMinus, FaPlus } from 'react-icons/fa';
import { Configure, InstantSearch } from 'react-instantsearch-dom';
import {
  allTruthy,
  checkViable,
  classNames,
  compareSemesters,
  findConflicts,
  getSchedulesBySemester,
} from '../../shared/util';
import { Semester, Viability } from '../../shared/firestoreTypes';
import { meiliSearchClient, useAppDispatch, useAppSelector } from '../../src/hooks';
import ScheduleChooser from '../ScheduleSelector';
import CourseCard, { DragStatus } from '../Course/CourseCard';
import FadeTransition from '../FadeTransition';
import { Requirement } from '../../src/requirements/util';
import ButtonMenu from './ButtonMenu';
import { selectSampleSchedule, selectSemesterFormat } from '../../src/features/semesterFormat';
import * as Schedules from '../../src/features/schedules';
import { selectClassCache } from '../../src/features/classCache';
import { selectUserUid, selectUserDocument } from '../../src/features/userData';
import { useModal } from '../../src/features/modal';
import useSearchState, { SearchStateProvider } from '../../src/context/searchState';
import Hits, { HitsDemo } from '../SearchComponents/Hits';
import SearchBox, { SearchBoxDemo } from '../SearchComponents/SearchBox';
import { ChosenScheduleContext } from '../../src/context/selectedSchedule';

const VIABILITY_COLORS: Record<Viability, string> = {
  Yes: 'bg-green-200',
  Likely: 'bg-blue-300',
  Unlikely: 'bg-yellow-200',
  No: 'bg-red-300',
};

function SearchModal() {
  const user = useAppSelector(selectUserUid);
  const { searchState, setSearchState } = useSearchState();

  return (
    <InstantSearch
      indexName="courses"
      searchClient={meiliSearchClient}
      searchState={searchState}
      onSearchStateChange={(newState) => {
        setSearchState({ ...searchState, ...newState });
      }}
      stalledSearchDelay={500}
    >
      {user && <Configure hitsPerPage={4} />}
      <div className="flex space-x-4">
        {/* <AttributeMenu /> */}
        <div className="flex-1 p-6 shadow-lg border-2 border-gray-300 bg-white rounded-lg space-y-4">
          {user ? <SearchBox /> : <SearchBoxDemo />}
          {user ? <Hits /> : <HitsDemo />}
        </div>
      </div>
    </InstantSearch>
  );
}

function ModalWrapper({ selected }: { selected: string | null }) {
  const [chosenScheduleId, chooseSchedule] = useState(selected);

  const context = useMemo(() => ({
    chooseSchedule,
    chosenScheduleId,
  }), [chosenScheduleId]);

  return (
    <SearchStateProvider oneCol>
      <ChosenScheduleContext.Provider value={context}>
        <SearchModal />
      </ChosenScheduleContext.Provider>
    </SearchStateProvider>
  );
}

export interface SemesterDisplayProps {
  semester: Semester;
  chosenScheduleId: string | null;
  highlight?: string;
}

interface SemesterComponentProps extends SemesterDisplayProps {
  highlightedRequirement: Requirement | undefined;
  handleChooseSchedule: React.Dispatch<string | null>;
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
  handleChooseSchedule,
  highlightedRequirement,
  dragStatus,
  setDragStatus,
  colWidth,
  highlight,
}: SemesterComponentProps) {
  const dispatch = useAppDispatch();
  const userDocument = useAppSelector(selectUserDocument);
  const semesterFormat = useAppSelector(selectSemesterFormat);
  const schedules = useAppSelector(Schedules.selectSchedules);
  const classCache = useAppSelector(selectClassCache);
  const sampleSchedule = useAppSelector(selectSampleSchedule);
  const { showCourse, showContents } = useModal();

  const editRef = useRef<HTMLInputElement>(null!);

  // independent to sync up the transitions nicely
  const [showSelector, setShowSelector] = useState(true);
  const [editing, setEditing] = useState(false);
  const [scheduleTitle, setScheduleTitle] = useState<string>();

  // the schedules for this semester to show
  const currentSchedules = getSchedulesBySemester(schedules, semester);
  const chosenSchedule = (() => {
    if (semesterFormat === 'sample') {
      return sampleSchedule?.schedules.find((schedule) => schedule.id === chosenScheduleId)!;
    }
    if (chosenScheduleId) return schedules[chosenScheduleId];
    return null;
  })();

  const conflicts = chosenSchedule
    ? findConflicts(allTruthy(chosenSchedule.classes.map(({ classId }) => classCache[classId])))
    : null;

  const draggedClass = dragStatus.dragging && classCache[dragStatus.data.classId];

  const viableDrop = useMemo(
    () => (userDocument.classYear && draggedClass && chosenSchedule
      ? checkViable({
        cls: draggedClass,
        schedule: chosenSchedule,
        classYear: userDocument.classYear,
        classCache,
      })
      : null),
    [classCache, userDocument, draggedClass, chosenSchedule],
  );

  function handleMinimize() {
    if (!chosenSchedule) return;
    dispatch(Schedules.toggleHidden(chosenSchedule.id));
  }

  const handleDrop: React.DragEventHandler<HTMLDivElement> = useCallback(
    (ev) => {
      ev.preventDefault();

      if (dragStatus.dragging && chosenScheduleId && viableDrop) {
        if (viableDrop.viability === 'No') {
          alert(viableDrop.reason);
        } else if (chosenScheduleId !== dragStatus.data.originScheduleId) {
          const doAdd = viableDrop.viability !== 'Unlikely'
            // eslint-disable-next-line no-restricted-globals
            || confirm(`${viableDrop.reason} Continue anyways?`);
          if (doAdd) {
            const { classId, originScheduleId } = dragStatus.data;
            dispatch(Schedules.addCourse([{ classId, scheduleId: chosenScheduleId }]));
            dispatch(Schedules.removeCourses([{ classId, scheduleId: originScheduleId }]));
          }
        }
      }

      setDragStatus({ dragging: false });
    },
    [dragStatus, chosenScheduleId, viableDrop],
  );

  // eslint-disable-next-line consistent-return
  const handleRenameSchedule: React.FormEventHandler<HTMLFormElement> = async (ev) => {
    ev.preventDefault();
    if (!chosenScheduleId) {
      return alert('no schedule selected to rename');
    }
    if (!scheduleTitle) return alert('invalid title given');
    const { payload } = await dispatch(Schedules.renameSchedule({ scheduleId: chosenScheduleId, newTitle: scheduleTitle }));
    if ('errors' in payload) {
      console.error(new Error(payload.errors.join(', ')));
      alert('Oops, couldn\'t rename your schedule. Please try again later.');
    } else {
      handleChooseSchedule(payload.newTitle);
      setEditing(false);
    }
  };

  const prevScheduleId = currentSchedules[0]?.title === chosenSchedule?.id ? null : (currentSchedules[0]?.title || null);

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
            <ScheduleChooser
              scheduleIds={currentSchedules.sort(compareSemesters).map((s) => s.id)}
              chosenScheduleId={chosenSchedule?.id || null}
              handleChooseSchedule={(scheduleId) => handleChooseSchedule(scheduleId)}
              direction="center"
              parentWidth={`${colWidth}px`}
              showTerm={semesterFormat === 'all' ? 'on' : 'auto'}
              highlight={
                typeof highlight !== 'undefined'
                && highlight === chosenSchedule?.id
              }
              showDropdown={semesterFormat !== 'all'}
            />
          )}

          {semesterFormat !== 'sample' && (
            <ButtonMenu
              prevScheduleId={prevScheduleId}
              {...{
                season: semester.season,
                year: semester.year,
                chosenScheduleId,
                handleChooseSchedule,
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
            {chosenSchedule
              && (
              <>
                {/* add course button */}
                <button
                  type="button"
                  className="flex items-center justify-center rounded-xl bg-blue-300 interactive py-2"
                  onClick={() => showContents({
                    title: 'Add a course',
                    content: <ModalWrapper selected={chosenScheduleId} />,
                  })}
                >
                  <FaPlus />
                </button>
                {/* <Link href={{ pathname: '/search', query: { selected: selectedSchedule?.id } }}> */}
                {/* </Link> */}

                {chosenSchedule.classes.map(({ classId: id }) => (id && classCache[id] ? (
                  <CourseCard
                    key={id}
                    course={classCache[id]}
                    handleExpand={() => showCourse(classCache[id])}
                    highlight={
                      highlightedRequirement
                      && highlightedRequirement.reducer(
                        highlightedRequirement.initialValue || 0,
                        classCache[id],
                        chosenSchedule!,
                        userDocument,
                      ) !== null
                    }
                    chosenScheduleId={chosenSchedule.id}
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
