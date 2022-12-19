import React, {
  useEffect, useMemo, useRef, useState,
} from 'react';
import {
  FaAngleDoubleLeft,
  FaArrowsAltH,
  FaArrowsAltV,
  FaChevronLeft,
  FaChevronRight,
  FaPlus,
} from 'react-icons/fa';
import type { DownloadPlan, Season, Term } from '../../shared/types';
import {
  allTruthy,
  classNames,
  compareSemesters,
  getUniqueSemesters,
  sortSchedules,
  termToSemester,
} from '../../shared/util';
import {
  Auth,
  Planner, Profile, Schedules, Settings,
} from '../../src/features';
import {
  downloadJson, handleError, useAppDispatch, useAppSelector,
} from '../../src/hooks';
import { Requirement } from '../../src/requirements/util';
import type { DragStatus } from '../Course/CourseCard';
import UploadPlan from '../UploadPlan';
import SemesterComponent, { SemesterDisplayProps } from './SemesterDisplay';

interface WithResizeRef {
  resizeRef: React.MutableRefObject<HTMLDivElement>;
}

// gets a list of columns to be displayed in the table.
function useColumns() {
  const semesterFormat = useAppSelector(Planner.selectSemesterFormat);
  const userSchedules = useAppSelector(Schedules.selectSchedules);
  const classYear = useAppSelector(Profile.selectClassYear);
  const sampleSchedule = useAppSelector(Planner.selectSampleSchedule);
  const chosenSchedules = useAppSelector(Settings.selectChosenSchedules);

  const columns: SemesterDisplayProps[] = useMemo(() => {
    switch (semesterFormat) {
      case 'sample':
        if (!sampleSchedule) return [];
        return sampleSchedule.schedules.map(({ year, season, id }) => ({
          semester: { year, season },
          chosenScheduleId: id,
          key: id,
        }));

      case 'selected':
        if (!classYear) return [];
        return getUniqueSemesters(
          classYear,
          ...Object.values(userSchedules),
        ).map(({ year, season }) => ({
          key: `${year}${season}`,
          semester: { year, season },
          chosenScheduleId: chosenSchedules[`${year}${season}`] || null,
        }));

      case 'all':
        return Object.values(userSchedules)
          .sort(compareSemesters)
          .map(({ year, season, id }) => ({
            key: id,
            semester: { year, season },
            chosenScheduleId: id,
            highlight: chosenSchedules[`${year}${season}`] || undefined,
          }));

      default:
        return [];
    }
  }, [classYear, sampleSchedule?.schedules, userSchedules, chosenSchedules, semesterFormat]);

  return columns;
}

export function HeaderSection({ resizeRef }: WithResizeRef) {
  const dispatch = useAppDispatch();
  const userSchedules = useAppSelector(Schedules.selectSchedules);
  const chosenSchedules = useAppSelector(Settings.selectChosenSchedules);
  const showReqs = useAppSelector(Planner.selectShowReqs);
  const isExpanded = useAppSelector(Planner.selectExpandCards);
  const semesterFormat = useAppSelector(Planner.selectSemesterFormat);
  const sampleSchedule = useAppSelector(Planner.selectSampleSchedule);
  const columns = useColumns();

  const downloadData: DownloadPlan = {
    id: semesterFormat === 'sample'
      ? sampleSchedule!.id
      : Math.random().toString(16).slice(2, 18),
    schedules: allTruthy(
      columns.map(({ chosenScheduleId }) => (chosenScheduleId ? userSchedules[chosenScheduleId] : null)),
    ),
  };

  const totalCourses = useMemo(
    () => Object.values(chosenSchedules).reduce(
      (acc, scheduleId) => acc + ((scheduleId && userSchedules[scheduleId]?.classes.length) || 0),
      0,
    ),
    [userSchedules, chosenSchedules],
  );

  return (
    <div className="relative text-white">
      {!showReqs && (
      <button
        title="Show requirements panel"
        type="button"
        onClick={() => dispatch(Planner.setShowReqs(true))}
        className="interactive absolute top-1 left-2"
      >
        <FaAngleDoubleLeft />
      </button>
      )}

      <div className="flex flex-col items-center justify-center gap-4">

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
            onClick={() => dispatch(Planner.toggleExpand())}
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
                  dispatch(Planner.showSelected());
                } else {
                  dispatch(Planner.showAll());
                }
              }}
              className="interactive rounded bg-gray-600 py-1 px-2"
            >
              {semesterFormat === 'all'
                ? 'Showing all schedules'
                : 'Showing only selected schedules'}
            </button>
          )}
          <button
            type="button"
            className="interactive underline"
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
              className="interactive underline"
              onClick={() => {
                // eslint-disable-next-line no-restricted-globals
                const yn = confirm(
                  'Are you sure? This will remove all courses from all selected schedules!',
                );
                if (yn) {
                  allTruthy(
                    Object.values(chosenSchedules).map((id) => (id ? userSchedules[id] : null)),
                  ).forEach((schedule) => dispatch(Schedules.clearSchedule(schedule.id)));
                }
              }}
            >
              Reset all
            </button>
          )}
        </div>

        <div
          ref={resizeRef}
          className="flex w-24 min-w-[96px] max-w-full resize-x justify-center overflow-auto rounded bg-gray-600 py-1"
        >
          <FaArrowsAltH />
        </div>
      </div>
    </div>
  );
}


export function SemestersList({
  resizeRef, highlightedRequirement,
}: WithResizeRef & { highlightedRequirement: Requirement | undefined }) {
  const dispatch = useAppDispatch();
  const userId = Auth.useAuthProperty('uid')!;
  const userSchedules = useAppSelector(Schedules.selectSchedules);
  const semesterFormat = useAppSelector(Planner.selectSemesterFormat);
  const hiddenIds = useAppSelector(Planner.selectHiddenIds);
  const hiddenTerms = useAppSelector(Planner.selectHiddenTerms);
  const classYear = useAppSelector(Profile.selectClassYear);

  // default w-56 = 224px
  // the resize bar starts at w-24 = 96px
  const [colWidth, setWidth] = useState(224);
  const [leftIntersecting, setLeftIntersecting] = useState(false);
  const [rightIntersecting, setRightIntersecting] = useState(false);

  const semestersContainerRef = useRef<HTMLDivElement>(null!);
  const leftScrollRef = useRef<HTMLDivElement>(null!);
  const rightScrollRef = useRef<HTMLDivElement>(null!);

  const [dragStatus, setDragStatus] = useState<DragStatus>({
    dragging: false,
  });

  const columns = useColumns();

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

  // add a schedule whose semester is before the current earliest semester
  function addPrevSemester() {
    const earliest = sortSchedules(userSchedules)[0];
    const [season, year] = earliest.season === 'Spring'
      ? ['Fall' as Season, earliest.year - 1]
      : ['Spring' as Season, earliest.year];
    dispatch(Schedules.createDefaultSchedule({ season, year }, userId)).catch(handleError);
  }

  return (
    <div className="relative mt-4 flex-1 overflow-x-auto">
      {/* on small screens, this extends as far as necessary */}
      {/* on medium screens and larger, put this into its own box */}
      <div
        className="absolute inset-0 grid grid-flow-col overflow-auto rounded-lg"
        ref={semestersContainerRef}
      >
        {/* when dragging a card, drag over this area to scroll left */}
        <div ref={leftScrollRef} />

        {/* add previous semester button */}
        {semesterFormat === 'selected' && classYear && (
        <button
          type="button"
          className="interactive h-full grow-0 bg-blue-300 px-4"
          onClick={addPrevSemester}
          name="Add previous semester"
          title="Add previous semester"
        >
          <FaPlus />
        </button>
        )}

        {columns
          .filter((column) => {
            if (semesterFormat === 'all') {
              if (column.chosenScheduleId && column.chosenScheduleId in hiddenIds) {
                return false;
              }
              return true;
            }
            if ((`${column.semester.year}${column.semester.season}` as Term) in hiddenTerms) {
              return false;
            }
            return true;
          })
          .map((column) => (
            <SemesterComponent
              {...{
                ...column,
                colWidth,
                dragStatus,
                setDragStatus,
                highlightedRequirement,
              }}
            />
          ))}

        {/* when dragging, drag over this area to scroll right */}
        <div ref={rightScrollRef} />
      </div>

      {dragStatus.dragging && (
      <>
        {leftIntersecting || (
        <div
          className="absolute inset-y-0 left-0 z-10 flex w-1/6 justify-center bg-gray-800/30 pt-4 text-4xl text-white"
          onDragOver={() => {
            semestersContainerRef.current.scrollBy(-2, 0);
          }}
        >
          <FaChevronLeft />
        </div>
        )}

        {rightIntersecting || (
        <div
          className="absolute inset-y-0 right-0 z-10 flex w-1/6 justify-center bg-gray-800/30 pt-4 text-4xl text-white"
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
  );
}


export function HiddenSchedules() {
  const dispatch = useAppDispatch();
  const format = useAppSelector(Planner.selectSemesterFormat);
  const hiddenTerms = useAppSelector(Planner.selectHiddenTerms);
  const hiddenIds = useAppSelector(Planner.selectHiddenIds);
  const schedules = useAppSelector(Schedules.selectSchedules);
  const hidden = format === 'all' ? hiddenIds : hiddenTerms;

  if (Object.keys(hidden).length === 0) return null;

  return (
    <div className="mt-4 flex items-center text-white">
      <h3>Hidden schedules:</h3>
      <ul className="flex items-center">
        {Object.keys(hidden).map((data) => {
          let title: string;
          if (format === 'all') {
            title = schedules[data].title || data;
          } else {
            const semester = termToSemester(data as Term);
            title = `${semester.season} ${semester.year}`;
          }
          return (
            <li key={title} className="ml-2">
              <button
                type="button"
                onClick={() => {
                  if (format === 'all') {
                    dispatch(Planner.setHiddenId({ id: data, hidden: false }));
                  } else {
                    dispatch(Planner.setHiddenTerm({ term: data as Term, hidden: false }));
                  }
                }}
                className="interactive"
              >
                {title}
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
