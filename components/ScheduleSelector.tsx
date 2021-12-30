/* eslint-disable jsx-a11y/anchor-is-valid */
import { Listbox } from '@headlessui/react';
import React from 'react';
import { FaAngleDown } from 'react-icons/fa';
import { Schedule } from '../shared/firestoreTypes';
import { classNames, compareSemesters } from '../shared/util';
import FadeTransition from './FadeTransition';

export interface ScheduleSelectorProps {
  selectedSchedule: Schedule | null;
  selectSchedule: React.Dispatch<Schedule>;
  schedules: Schedule[];
}

const ScheduleSelector: React.FC<ScheduleSelectorProps> = function ({
  schedules, selectedSchedule, selectSchedule,
}) {
  return (
    <div className="flex flex-col items-center">
      <Listbox
        value={selectedSchedule}
        onChange={selectSchedule}
        as="div"
        className="relative inline-block"
      >
        {({ open }) => (
          <>
            <Listbox.Button className={classNames(
              schedules.length === 0 && 'cursor-not-allowed text-gray-700 bg-gray-300',
              'shadow text-sm font-semibold rounded flex items-center py-2 px-3 min-w-max',
            )}
            >
              {selectedSchedule?.id || 'Select a schedule'}
              {' '}
              <FaAngleDown className={classNames(
                'ml-4',
                open && 'transform rotate-180 transition-transform',
              )}
              />
            </Listbox.Button>
            {schedules.length > 0 && (
            <FadeTransition>
              <Listbox.Options className="absolute mt-2 w-full min-w-max shadow z-30">
                {schedules.sort(compareSemesters).map((schedule) => (
                  <Listbox.Option
                    key={schedule.id}
                    value={schedule}
                    className="even:bg-white w-full min-w-max cursor-default odd:bg-gray-300 bg-opacity-50 py-2 px-3 first:rounded-t last:rounded-b focus:ring-blue-700 focus:ring-2"
                  >
                    {schedule.id}
                    {' '}
                    (
                    {schedule.classes.length}
                    )
                  </Listbox.Option>
                ))}
              </Listbox.Options>
            </FadeTransition>
            )}
          </>
        )}
      </Listbox>
    </div>
  );
};

export default ScheduleSelector;
