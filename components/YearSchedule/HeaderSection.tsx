import { Menu } from '@headlessui/react';
import React, { useMemo } from 'react';
import {
  FaAngleDoubleLeft,
  FaArrowsAltH,
  FaCog,
} from 'react-icons/fa';
import { useModal } from 'src/context/modal';
import { DownloadPlan } from '../../shared/types';
import { allTruthy } from '../../shared/util';
import { Planner, Schedules, Settings } from '../../src/features';
import { downloadJson, useAppDispatch, useAppSelector } from '../../src/hooks';
import UploadForm from '../UploadForm';
import CardExpandToggler from './CardExpandToggler';
import { WithResizeRef } from './PlanningSection';
import { SemesterDisplayProps } from './SemesterDisplay';

/**
 * The header section of the planning page.
 */
export default function HeaderSection({ resizeRef, columns }: WithResizeRef & { columns: SemesterDisplayProps[] }) {
  const dispatch = useAppDispatch();
  const showReqs = useAppSelector(Planner.selectShowReqs);
  const semesterFormat = useAppSelector(Planner.selectSemesterFormat);

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
              className="interactive rounded bg-gray-600 py-1 px-2"
            >
              {semesterFormat === 'all'
                ? 'All schedules'
                : 'Only selected schedules'}
            </button>
          )}

          <div
            ref={resizeRef}
            className="flex w-24 min-w-[96px] max-w-full resize-x justify-center overflow-auto rounded bg-gray-600 py-1"
          >
            <FaArrowsAltH />
          </div>
        </div>
      </div>
    </div>
  );
}

function OptionsMenu({ columns }: { columns: SemesterDisplayProps[] }) {
  const dispatch = useAppDispatch();
  const userSchedules = useAppSelector(Schedules.selectSchedules);
  const semesterFormat = useAppSelector(Planner.selectSemesterFormat);
  const sampleSchedule = useAppSelector(Planner.selectSampleSchedule);
  const chosenSchedules = useAppSelector(Settings.selectChosenSchedules);

  const { showContents } = useModal();

  const totalCourses = useMemo(
    () => Object.values(chosenSchedules).reduce(
      (acc, scheduleId) => acc + ((scheduleId && userSchedules[scheduleId]?.classes.length) || 0),
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

  return (
    <Menu as="div" className="absolute top-1 right-2">
      <Menu.Button>
        <FaCog className="transition-opacity hover:opacity-50" />
      </Menu.Button>
      <Menu.Items className="absolute top-full right-0 z-10 mt-2 space-y-1  rounded bg-white p-2 text-sm text-black shadow-xl">
        <span className="whitespace-nowrap text-gray-600">
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
                ? `Sample ${sampleSchedule?.id} - Plan Crimson`
                : 'Selected schedules - Plan Crimson',
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
