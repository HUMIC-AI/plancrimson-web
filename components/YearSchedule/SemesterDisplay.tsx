import Link from 'next/link';
import React from 'react';
import {
  FaCalendarWeek, FaClone, FaSearch,
} from 'react-icons/fa';
import { getSchedulesBySemester } from '../../shared/util';
import useUserData from '../../src/context/userData';
import { Season } from '../../shared/firestoreTypes';
import { useCourseDialog } from '../../src/hooks';
import ScheduleSelector from '../ScheduleSelector';
import CourseCard, { DragStatus } from '../Course/CourseCard';
import CourseDialog from '../Course/CourseDialog';
import useClassCache from '../../src/context/classCache';

type Props = {
  selectedScheduleId: string | null;
  selectSchedule: React.Dispatch<string>;

  year: number;
  season: Season;

  highlightedClasses: string[];
  dragStatus: DragStatus;
  setDragStatus: React.Dispatch<React.SetStateAction<DragStatus>>;
};

const SemesterDisplay: React.FC<Props> = function ({
  year, season, selectedScheduleId, selectSchedule, highlightedClasses, dragStatus, setDragStatus,
}) {
  const {
    data, addCourses, removeCourses, createSchedule,
  } = useUserData();
  const {
    closeModal, handleExpand, isOpen, openedCourse,
  } = useCourseDialog();
  const getClass = useClassCache(data);

  let containerStyles = 'p-4 text-center flex-1 rounded-xl shadow-lg w-52 ';
  if (dragStatus.dragging) {
    containerStyles += (dragStatus.data.originScheduleId === selectedScheduleId
      ? 'bg-blue-300'
      : 'bg-gray-300 cursor-not-allowed');
  } else {
    containerStyles += 'odd:bg-gray-300 even:bg-white';
  }

  const schedules = getSchedulesBySemester(data, year, season);
  const selectedSchedule = selectedScheduleId ? data.schedules[selectedScheduleId] : null;

  return (
    <div
      className={containerStyles}
      onDragOver={(ev) => {
        ev.preventDefault();
        // eslint-disable-next-line no-param-reassign
        ev.dataTransfer.dropEffect = 'move';
      }}
      onDrop={(ev) => {
        ev.preventDefault();
        if (!selectedScheduleId) return;
        if (dragStatus.dragging) {
          const { classId, originScheduleId } = dragStatus.data;
          addCourses({ classId, scheduleId: selectedScheduleId });
          removeCourses({ classId, scheduleId: originScheduleId });
        }
        setDragStatus({ dragging: false });
      }}
    >
      <h1 className="mb-2 py-2 text-lg border-black border-b-2">
        {year}
        {' '}
        {season}
      </h1>

      <ScheduleSelector
        schedules={schedules}
        selectedSchedule={selectedSchedule}
        selectSchedule={(schedule) => selectSchedule(schedule.id)}
        direction="center"
      />

      {selectedSchedule && (
        <div>
          <div className="flex justify-center items-center gap-2 mt-2 text-gray-500">
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
              onClick={async () => {
                const newSchedule = await createSchedule(`${selectedSchedule.id} copy`, selectedSchedule.year, selectedSchedule.season, selectedSchedule.classes);
                selectSchedule(newSchedule.id);
              }}
              className="p-1 rounded bg-black bg-opacity-0 hover:text-black transition-colors"
            >
              <FaClone />
            </button>
          </div>
          {selectedSchedule.classes.length > 0 && (
          <p className="text-sm">
            Expected hours per week:
            <br />
            {selectedSchedule.classes.map(({ classId }) => getClass(classId)?.meanHours?.toFixed(2) || '?').join(' + ')}
            <br />
            {' = '}
            {selectedSchedule.classes.reduce((acc, { classId }) => acc + (getClass(classId)?.meanHours || 0), 0).toFixed(2)}
            {selectedSchedule.classes.find(({ classId }) => !getClass(classId)?.meanHours) && ' + ?'}
          </p>
          )}
        </div>
      )}

      <div className="flex flex-col items-stretch gap-4 mt-2">
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
      <CourseDialog isOpen={isOpen} closeModal={closeModal} course={openedCourse} />
    </div>
  );
};

export default SemesterDisplay;
