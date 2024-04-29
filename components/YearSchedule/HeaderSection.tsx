import { Menu } from '@headlessui/react';
import React, { useMemo } from 'react';
import {
  FaAngleDoubleLeft,
  FaArrowsAltH,
  FaCog,
} from 'react-icons/fa';
import { Semester, allTruthy, semesterToTerm } from '@/src/lib';
import { useModal } from '@/src/context/modal';
import { Planner, Schedules, Settings } from '@/src/features';
import { useAppDispatch, useAppSelector } from '@/src/utils/hooks';
import { downloadJson } from '@/src/utils/utils';
import type { DownloadPlan, ListOfScheduleIdOrSemester } from '@/src/types';
import { isListOfScheduleIds } from '@/src/utils/schedules';
import { getClassIdsOfSchedule } from '@/src/features/schedules';
import UploadForm from './UploadForm';
import CardExpandToggler from './CardExpandToggler';
import { WithResizeRef } from './PlanningSection';

/**
 * The header section of the planning page.
 */
export default function PlanningPageHeaderSection({ resizeRef, columns }: WithResizeRef & { columns: ListOfScheduleIdOrSemester }) {
  const dispatch = useAppDispatch();
  const showReqs = useAppSelector(Planner.selectShowReqs);
  const semesterFormat = useAppSelector(Planner.selectSemesterFormat);

  return (
    <div className="relative">
      {!showReqs && (
        <button
          title="Show requirements panel"
          type="button"
          onClick={() => dispatch(Planner.setShowReqs(true))}
          className="interactive absolute left-2 top-1"
        >
          <FaAngleDoubleLeft />
        </button>
      )}

      <OptionsMenu columns={columns} />

      <div className="flex flex-col items-center justify-center gap-4">

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
              className="button secondary-gray"
            >
              {semesterFormat === 'all'
                ? 'All schedules'
                : 'Only selected schedules'}
            </button>
          )}

          <div
            ref={resizeRef}
            className="interactive secondary-gray hidden w-24 min-w-[96px] max-w-full resize-x overflow-auto rounded py-1 md:flex md:justify-center"
          >
            <FaArrowsAltH />
          </div>
        </div>
      </div>
    </div>
  );
}

function OptionsMenu({ columns }: { columns: ListOfScheduleIdOrSemester }) {
  const dispatch = useAppDispatch();
  const userSchedules = useAppSelector(Schedules.selectSchedules);
  const semesterFormat = useAppSelector(Planner.selectSemesterFormat);
  const sampleSchedule = useAppSelector(Planner.selectSampleSchedule);
  const chosenSchedules = useAppSelector(Settings.selectChosenSchedules);

  const { showContents } = useModal();

  const totalCourses = useMemo(
    () => Object.values(chosenSchedules).reduce(
      (acc, scheduleId) => acc + ((scheduleId && getClassIdsOfSchedule(userSchedules[scheduleId]).length) || 0),
      0,
    ),
    [userSchedules, chosenSchedules],
  );

  const scheduleForSemester = (semester: Semester) => {
    const id = chosenSchedules[semesterToTerm(semester)];
    return id ? userSchedules[id] ?? null : null;
  };

  const downloadData: DownloadPlan = {
    id: semesterFormat === 'sample'
      ? sampleSchedule!.id
      : Math.random().toString(16).slice(2, 18),
    schedules: allTruthy(isListOfScheduleIds(columns)
      ? columns.map((id) => userSchedules[id] ?? null)
      : columns.map(scheduleForSemester)),
  };

  return (
    <Menu as="div" className="absolute right-2 top-1">
      <Menu.Button>
        <FaCog className="transition-opacity hover:opacity-50" />
      </Menu.Button>
      <Menu.Items className="absolute right-0 top-full z-10 mt-2 space-y-1  rounded bg-white p-2 text-sm text-black shadow-xl">
        <span className="whitespace-nowrap text-gray-dark">
          Total courses:
          {' '}
          {totalCourses}
          {' '}
          / 32
        </span>

        <Menu.Item>
          <button
            type="button"
            className="transition-opacity hover:opacity-50"
            onClick={() => downloadJson(
              semesterFormat === 'sample'
                ? `Sample ${sampleSchedule?.id} - PlanCrimson`
                : 'Selected schedules - PlanCrimson',
              downloadData,
            )}
          >
            Download all
          </button>
        </Menu.Item>
        <Menu.Item>
          <button
            type="button"
            onClick={() => showContents({
              content: <UploadForm />,
              title: 'Upload plan',
              close: 'back',
            })}
            className="transition-opacity hover:opacity-50"
          >
            Upload plan
          </button>
        </Menu.Item>
        <Menu.Item>
          {semesterFormat !== 'sample' && (
          <button
            type="button"
            className="transition-opacity hover:opacity-50"
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
        </Menu.Item>
      </Menu.Items>
    </Menu>
  );
}
