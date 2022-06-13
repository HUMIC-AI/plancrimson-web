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
import { DownloadPlan, Season } from '../../shared/firestoreTypes';
import {
  allTruthy,
  classNames,
  compareSemesters,
  getUniqueSemesters,
  sortSchedules,
} from '../../shared/util';
import {
  Auth, Planner, Profile, Schedules, Settings,
} from '../../src/features';
import {
  downloadJson, handleError, signInUser, useAppDispatch, useAppSelector,
} from '../../src/hooks';
import type { Requirement } from '../../src/requirements/util';
import type { DragStatus } from '../Course/CourseCard';
import UploadPlan from '../UploadPlan';
import SemesterComponent, { SemesterDisplayProps } from './SemesterDisplay';


// render all of the user's semesters
export default function PlanningSection({ highlightedRequirement } : { highlightedRequirement?: Requirement; }) {
  const dispatch = useAppDispatch();
  const userId = Auth.useAuthProperty('uid');
  const {
    classYear, semesterFormat, sampleSchedule, schedules: userSchedules,
  } = useAppSelector((state) => ({
    classYear: Profile.selectClassYear(state),
    semesterFormat: Planner.selectSemesterFormat(state),
    sampleSchedule: Planner.selectSampleSchedule(state),
    schedules: Schedules.selectSchedules(state),
  }));
  const chosenSchedules = useAppSelector(Settings.selectChosenSchedules);
  const showReqs = useAppSelector(Planner.selectShowReqs);

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

  const chooseSchedule = (year: number, season: Season, scheduleId: string | null) => dispatch(Settings.chooseSchedule({
    term: `${year}${season}`,
    scheduleId,
  }));

  // the set of columns in our table, each representing a semester
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

  const totalCourses = useMemo(
    () => Object.values(chosenSchedules).reduce(
      (acc, scheduleId) => acc
          + ((scheduleId && userSchedules[scheduleId]?.classes.length) || 0),
      0,
    ),
    [userSchedules, chosenSchedules],
  );

  const downloadData: DownloadPlan = {
    id: semesterFormat === 'sample'
      ? sampleSchedule!.id
      : Math.random().toString(16).slice(2, 18),
    schedules: allTruthy(
      columns.map(({ chosenScheduleId }) => (chosenScheduleId ? userSchedules[chosenScheduleId] : null)),
    ),
  };

  // add a schedule whose semester is before the current earliest semester
  function addPrevSemester() {
    if (!userId) return;
    const earliest = sortSchedules(userSchedules)[0];
    const [season, year] = earliest.season === 'Spring'
      ? ['Fall' as Season, earliest.year - 1]
      : ['Spring' as Season, earliest.year];
    dispatch(Schedules.createDefaultSchedule({ season, year }, userId)).catch(handleError);
  }

  return (
    <div className={classNames(
      showReqs && 'md:rounded-lg',
      'relative bg-gray-800 md:p-4 md:shadow-lg row-start-1 md:row-auto overflow-auto max-w-full md:h-full',
    )}
    >
      <div className="flex flex-col space-y-4 md:h-full">
        <HeaderSection
          totalCourses={totalCourses}
          resizeRef={resizeRef}
          downloadData={downloadData}
        />

        {/* begin semesters display */}
        <div className="relative overflow-x-auto flex-1">
          {/* on small screens, this extends as far as necessary */}
          {/* on medium screens and larger, put this into its own box */}
          <div
            className="md:absolute md:inset-0 grid grid-flow-col rounded-t-lg rounded-b-lg overflow-auto"
            ref={semestersContainerRef}
          >
            {/* when dragging a card, drag over this area to scroll left */}
            <div ref={leftScrollRef} />

            {/* If the user is signed in, show the semesters. Otherwise show "Sign in to get started" */}
            {userId ? (
              <>
                {/* add previous semester button */}
                {semesterFormat === 'selected' && classYear && (
                  <button
                    type="button"
                    className="bg-blue-300 interactive h-full px-4 flex-grow-0"
                    onClick={addPrevSemester}
                    name="Add previous semester"
                    title="Add previous semester"
                  >
                    <FaPlus />
                  </button>
                )}

                {columns.map((column) => (
                  <SemesterComponent
                    {...{
                      ...column,
                      colWidth,
                      dragStatus,
                      setDragStatus,
                      highlightedRequirement,
                      handleChooseSchedule(id) {
                        chooseSchedule(column.semester.year, column.semester.season, id);
                      },
                    }}
                  />
                ))}
              </>
            ) : (
              <div className="h-full flex items-center justify-center">
                <button
                  type="button"
                  className="text-white font-black text-6xl interactive"
                  onClick={() => signInUser().catch(handleError)}
                >
                  Sign in to get started!
                </button>
              </div>
            )}

            {/* when dragging, drag over this area to scroll right */}
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

        <HiddenSchedules allSemesters={columns} />
      </div>
    </div>
  );
}


interface HeaderSectionProps {
  totalCourses: number;
  resizeRef: React.MutableRefObject<HTMLDivElement>;
  downloadData: any;
}

function HeaderSection({ totalCourses, resizeRef, downloadData }: HeaderSectionProps) {
  const dispatch = useAppDispatch();
  const userSchedules = useAppSelector(Schedules.selectSchedules);
  const chosenSchedules = useAppSelector(Settings.selectChosenSchedules);
  const showReqs = useAppSelector(Planner.selectShowReqs);
  const isExpanded = useAppSelector(Planner.selectExpandCards);
  const semesterFormat = useAppSelector(Planner.selectSemesterFormat);
  const sampleSchedule = useAppSelector(Planner.selectSampleSchedule);

  return (
    <div className="text-white relative">
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
              className="py-1 px-2 bg-gray-600 interactive rounded"
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
          className="flex justify-center rounded py-1 w-24 min-w-[96px] max-w-full resize-x bg-gray-600 overflow-auto"
        >
          <FaArrowsAltH />
        </div>
      </div>
    </div>
  );
}


function HiddenSchedules({ allSemesters } : { allSemesters: SemesterDisplayProps[] }) {
  const dispatch = useAppDispatch();
  const hiddenScheduleIds = useAppSelector(Planner.selectHiddenIds);
  const hiddenSchedules = allSemesters.filter(({ chosenScheduleId }) => chosenScheduleId && hiddenScheduleIds[chosenScheduleId]);

  if (hiddenSchedules.length === 0) return null;

  return (
    <div className="flex text-white items-center">
      <h3>Hidden schedules:</h3>
      <ul className="flex items-center">
        {hiddenSchedules.map((data) => (
          <li key={data.chosenScheduleId! + data.semester.year + data.semester.season} className="ml-2">
            <button
              type="button"
              onClick={() => {
                dispatch(Planner.setHidden({ scheduleId: data.chosenScheduleId!, hidden: true }));
              }}
              className="interactive"
            >
              {data.chosenScheduleId}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
