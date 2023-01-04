import React, { useMemo } from 'react';
import {
  FaAngleDoubleLeft,
  FaArrowsAltH,
} from 'react-icons/fa';
import { DownloadPlan } from '../../shared/types';
import { allTruthy } from '../../shared/util';
import { Planner, Schedules, Settings } from '../../src/features';
import { downloadJson, useAppDispatch, useAppSelector } from '../../src/hooks';
import UploadPlan from '../UploadPlan';
import CardExpandToggler from './CardExpandToggler';
import { WithResizeRef } from './PlanningSection';
import { SemesterDisplayProps } from './SemesterDisplay';

/**
 * The header section of the planning page.
 */
export default function HeaderSection({ resizeRef, columns }: WithResizeRef & { columns: SemesterDisplayProps[] }) {
  const dispatch = useAppDispatch();
  const userSchedules = useAppSelector(Schedules.selectSchedules);
  const chosenSchedules = useAppSelector(Settings.selectChosenSchedules);
  const showReqs = useAppSelector(Planner.selectShowReqs);
  const semesterFormat = useAppSelector(Planner.selectSemesterFormat);
  const sampleSchedule = useAppSelector(Planner.selectSampleSchedule);

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
          <CardExpandToggler />
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
                ? 'All schedules'
                : 'Only selected schedules'}
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
