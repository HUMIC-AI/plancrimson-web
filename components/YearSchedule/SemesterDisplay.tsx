import Link from 'next/link';
import React from 'react';
import {
  FaCalendarWeek, FaClone, FaSearch,
} from 'react-icons/fa';
import { classNames, getSchedulesBySemester } from '../../shared/util';
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

  const schedules = getSchedulesBySemester(data, year, season);
  const selectedSchedule = selectedScheduleId ? data.schedules[selectedScheduleId] : null;

  return (
    <div className={classNames(
      'relative h-full overflow-y-hidden w-52 md:w-64 lg:w-72',
      // eslint-disable-next-line no-nested-ternary
      dragStatus.dragging
        ? (dragStatus.data.originScheduleId === selectedScheduleId
          ? 'bg-blue-300'
          : 'bg-gray-300 cursor-not-allowed')
        : 'odd:bg-gray-300 even:bg-white',
    )}
    >
      <div
        className="flex flex-col h-full"
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
        <div className="flex justify-between items-center py-2 px-4 border-black border-b-2">
          <h1 className="text-lg">
            {year}
            {' '}
            {season}
          </h1>

          <div>
            <ScheduleSelector
              schedules={schedules}
              selectedSchedule={selectedSchedule}
              selectSchedule={(schedule) => selectSchedule(schedule.id)}
              direction="center"
            />

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
                onClick={async () => {
                  const newSchedule = await createSchedule(`${selectedSchedule.id} copy`, selectedSchedule.year, selectedSchedule.season, selectedSchedule.classes);
                  selectSchedule(newSchedule.id);
                }}
                className="p-1 rounded bg-black bg-opacity-0 hover:text-black transition-colors"
              >
                <FaClone />
              </button>
            </div>
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
        <div className="flex-1 p-4 overflow-auto">
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
