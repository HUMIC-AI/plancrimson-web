import { updateDoc } from 'firebase/firestore';
import React, {
  useEffect, useMemo, useRef, useState,
} from 'react';
import {
  FaArrowsAltH,
  FaArrowsAltV,
  FaChevronLeft,
  FaChevronRight,
} from 'react-icons/fa';
import { DownloadPlan, Season } from '../../shared/firestoreTypes';
import {
  allTruthy,
  classNames,
  compareSemesters,
  getUniqueSemesters,
} from '../../shared/util';
import { useAppDispatch, useAppSelector } from '../../src/app/hooks';
import {
  selectSchedule, selectSelectedSchedules, selectSchedules, clearSchedule,
} from '../../src/features/schedules';
import {
  selectExpandCards, selectSampleSchedule, selectSemesterFormat, showAll, showSelected, toggleExpand,
} from '../../src/features/semesterFormat';
import { selectClassYear, selectUid } from '../../src/features/userData';
import { downloadJson, getUserRef } from '../../src/hooks';
import { Requirement } from '../../src/requirements/util';
import { DragStatus } from '../Course/CourseCard';
import UploadPlan from '../UploadPlan';
import SemesterComponent from './SemesterDisplay';

type Props = {
  highlightedRequirement: Requirement | undefined;
};

const HeaderSection: React.FC<{
  totalCourses: number;
  resizeRef: React.MutableRefObject<HTMLDivElement>;
  downloadData: any;
}> = function ({ totalCourses, resizeRef, downloadData }) {
  const dispatch = useAppDispatch();
  const selectedSchedules = useAppSelector(selectSelectedSchedules);
  const isExpanded = useAppSelector(selectExpandCards);
  const semesterFormat = useAppSelector(selectSemesterFormat);
  const sampleSchedule = useAppSelector(selectSampleSchedule);
  const schedules = useAppSelector(selectSchedules);

  return (
    <div className="text-white space-y-4">
      <div className="flex flex-col items-center justify-center lg:flex-row xl:justify-start gap-4">
        <span className="whitespace-nowrap">
          Total courses:
          {' '}
          {totalCourses}
          {' '}
          / 32
        </span>
        <div className="flex flex-wrap items-center justify-center gap-4 text-sm">
          <button
            type="button"
            onClick={() => dispatch(toggleExpand())}
            className={classNames(
              isExpanded ? 'bg-white text-gray-800' : 'bg-gray-800 text-white',
              'rounded-full hover:opacity-50 p-1 border',
            )}
          >
            <FaArrowsAltV />
          </button>
          {semesterFormat !== 'sample' && (
            <button
              type="button"
              onClick={() => {
                if (semesterFormat === 'all') {
                  dispatch(showSelected());
                } else {
                  dispatch(showAll());
                }
              }}
              className="py-1 px-2 bg-gray-600 hover:opacity-50 transition-opacity rounded"
            >
              {semesterFormat === 'all'
                ? 'Showing all schedules'
                : 'Showing only selected schedules'}
            </button>
          )}
          <button
            type="button"
            className="hover:opacity-50 transition-opacity underline"
            onClick={() => downloadJson(
              semesterFormat === 'sample'
                ? `Sample ${sampleSchedule?.id} - Plan Crimson`
                : 'Selected schedules - Plan Crimson',
              downloadData,
            )}
          >
            Download all
          </button>
          <UploadPlan />
          {semesterFormat !== 'sample' && (
            <button
              type="button"
              className="hover:opacity-50 transition-opacity underline"
              onClick={() => {
                // eslint-disable-next-line no-restricted-globals
                const yn = confirm(
                  'Are you sure? This will remove all courses from all selected schedules!',
                );
                if (yn) {
                  allTruthy(
                    Object.values(selectedSchedules).map((id) => (id ? schedules[id] : null)),
                  ).forEach((schedule) => dispatch(clearSchedule(schedule.id)));
                }
              }}
            >
              Reset all
            </button>
          )}
        </div>
      </div>
      <div className="flex justify-center xl:justify-start">
        <div
          ref={resizeRef}
          className="flex justify-center rounded py-1 w-24 min-w-[96px] max-w-full resize-x bg-gray-600 overflow-auto"
        >
          <FaArrowsAltH />
        </div>
      </div>
    </div>
  );
};

interface SemesterDisplayInfo {
  year: number;
  season: Season;
  selectedScheduleId: string | null;
  key: string;
  selectSchedule: React.Dispatch<string | null>;
  highlight?: string;
}

const PlanningSection: React.FC<Props> = function ({ highlightedRequirement }) {
  const dispatch = useAppDispatch();
  const {
    userUid, classYear, semesterFormat, sampleSchedule, schedules, selectedSchedules,
  } = useAppSelector((state) => ({
    userUid: selectUid(state),
    classYear: selectClassYear(state),
    semesterFormat: selectSemesterFormat(state),
    sampleSchedule: selectSampleSchedule(state),
    schedules: selectSchedules(state),
    selectedSchedules: selectSelectedSchedules(state),
  }));

  const [dragStatus, setDragStatus] = useState<DragStatus>({
    dragging: false,
  });
  // default w-56 = 224px
  // the resize bar starts at w-24 = 96px
  const [colWidth, setWidth] = useState(224);
  const [leftIntersecting, setLeftIntersecting] = useState(false);
  const [rightIntersecting, setRightIntersecting] = useState(false);

  const resizeRef = useRef<HTMLDivElement>(null!);
  const semestersContainerRef = useRef<HTMLDivElement>(null!);
  const leftScrollRef = useRef<HTMLDivElement>(null!);
  const rightScrollRef = useRef<HTMLDivElement>(null!);

  // conditionally show the left and right scroll bars
  // based on the user's current scroll position
  useEffect(() => {
    const resizeObserver = new ResizeObserver((entries) => {
      const newWidth = entries?.[0]?.borderBoxSize?.[0]?.inlineSize;
      if (newWidth) {
        setWidth(Math.max(Math.min(newWidth + 224 - 96, 2048), 224));
      }
    });
    resizeObserver.observe(resizeRef.current);
    const leftScrollObserver = new IntersectionObserver((entries) => {
      const isIntersecting = entries?.[0]?.isIntersecting;
      if (typeof isIntersecting === 'boolean') {
        setLeftIntersecting(isIntersecting);
      }
    });
    leftScrollObserver.observe(leftScrollRef.current);
    const rightScrollObserver = new IntersectionObserver((entries) => {
      const isIntersecting = entries?.[0]?.isIntersecting;
      if (typeof isIntersecting === 'boolean') {
        setRightIntersecting(isIntersecting);
      }
    });
    rightScrollObserver.observe(rightScrollRef.current);
    return () => {
      resizeObserver.disconnect();
      leftScrollObserver.disconnect();
      rightScrollObserver.disconnect();
    };
  }, []);

  const selectNewSchedule = (year: number, season: Season, scheduleId: string | null) => dispatch(selectSchedule({
    term: `${year}${season}`,
    scheduleId,
  }));

  const allSemesters: SemesterDisplayInfo[] = useMemo(() => {
    switch (semesterFormat) {
      case 'sample':
        return (
          sampleSchedule?.schedules.map(({ year, season, id }) => ({
            year,
            season,
            selectSchedule: (newId) => selectNewSchedule(year, season, newId),
            key: id,
            selectedScheduleId: id,
            highlight: false,
          })) || []
        );
      case 'selected':
        return getUniqueSemesters(
          classYear,
          Object.values(schedules),
        ).map(({ year, season }) => ({
          year,
          season,
          selectedScheduleId: selectedSchedules[`${year}${season}`] || null,
          key: year + season,
          selectSchedule: (id) => selectNewSchedule(year, season, id),
        }));
      case 'all':
        return Object.values(schedules)
          .sort(compareSemesters)
          .map(({ year, season, id }) => ({
            year,
            season,
            selectedScheduleId: id,
            key: id,
            selectSchedule: (newId) => selectNewSchedule(year, season, newId),
            highlight: selectedSchedules[`${year}${season}`] || undefined,
          }));
      default:
        return [];
    }
  }, [classYear, sampleSchedule?.schedules, schedules, selectedSchedules, semesterFormat]);

  const totalCourses = useMemo(
    () => Object.values(selectedSchedules).reduce(
      (acc, scheduleId) => acc
          + ((scheduleId && schedules[scheduleId]?.classes.length) || 0),
      0,
    ),
    [schedules, selectedSchedules],
  );

  const downloadData: DownloadPlan = {
    id: semesterFormat === 'sample'
      ? sampleSchedule!.id
      : Math.random().toString(16).slice(2, 18),
    schedules: allTruthy(
      allSemesters.map(({ selectedScheduleId }) => (selectedScheduleId ? schedules[selectedScheduleId] : null)),
    ),
  };

  const hiddenSchedules = allTruthy(allSemesters.map(({ selectedScheduleId }) => {
    if (!selectedScheduleId) return null;
    const schedule = schedules[selectedScheduleId];
    if (!schedule?.hidden) return null;
    return schedule.id;
  }));

  return (
    <div className="relative bg-gray-800 md:p-4 md:rounded-lg md:shadow-lg row-start-1 md:row-auto overflow-auto max-w-full md:h-full">
      <div className="flex flex-col space-y-4 md:h-full">
        <HeaderSection
          totalCourses={totalCourses}
          resizeRef={resizeRef}
          downloadData={downloadData}
        />

        <div className="relative overflow-x-auto flex-1">
          {/* on small screens, this extends as far as necessary */}
          {/* on medium screens and larger, put this into its own box */}
          <div
            className="md:absolute md:inset-0 grid grid-flow-col rounded-t-lg md:rounded-b-lg overflow-auto"
            ref={semestersContainerRef}
          >
            <div ref={leftScrollRef} />
            {allSemesters.map((props) => (
              <SemesterComponent
                {...{
                  ...props,
                  colWidth,
                  dragStatus,
                  setDragStatus,
                  highlightedRequirement,
                }}
              />
            ))}
            <div ref={rightScrollRef} />
          </div>

          {dragStatus.dragging && (
            <>
              {leftIntersecting || (
                <div
                  className="absolute inset-y-0 left-0 w-1/6 flex justify-center text-white text-4xl pt-4 bg-gray-800 bg-opacity-30 z-10"
                  onDragOver={() => {
                    semestersContainerRef.current.scrollBy(-2, 0);
                  }}
                >
                  <FaChevronLeft />
                </div>
              )}
              {rightIntersecting || (
                <div
                  className="absolute inset-y-0 right-0 w-1/6 flex justify-center text-white text-4xl pt-4 bg-gray-800 bg-opacity-30 z-10"
                  onDragOver={() => {
                    semestersContainerRef.current.scrollBy(2, 0);
                  }}
                >
                  <FaChevronRight />
                </div>
              )}
            </>
          )}
        </div>
        {/* end semesters display */}

        {hiddenSchedules.length > 0 && (
          <div className="flex text-white items-center">
            <h3>Hidden schedules:</h3>
            <ul className="flex items-center">
              {hiddenSchedules.map((id) => (
                <li key={id} className="ml-2">
                  <button
                    type="button"
                    onClick={() => {
                      if (!userUid) return;
                      updateDoc(getUserRef(userUid), `schedules.${id}.hidden`, false);
                    }}
                    className="hover:opacity-50 transition-opacity"
                  >
                    {id}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

// PlanningSection.whyDidYouRender = true;

export default PlanningSection;
