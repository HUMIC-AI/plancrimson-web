/* eslint-disable jsx-a11y/anchor-is-valid */
import { Listbox } from '@headlessui/react';
import React from 'react';
import { FaAngleDown } from 'react-icons/fa';
import { Schedule } from '../shared/firestoreTypes';
import { classNames, compareSemesters } from '../shared/util';
import FadeTransition from './FadeTransition';

export interface ScheduleSelectorProps {
  selectedSchedule: Schedule | null;
  selectSchedule: React.Dispatch<Schedule | null>;
  schedules: Schedule[];
  direction: 'left' | 'center' | 'right';
}

const ScheduleSelector: React.FC<ScheduleSelectorProps> = function ({
  schedules,
  selectedSchedule,
  selectSchedule,
  direction,
}) {
  const optionStyles = 'even:bg-white w-full min-w-max cursor-default odd:bg-gray-300 py-2 px-3 focus:ring-blue-700 focus:ring-2';

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
            <Listbox.Button
              name="Select schedule"
              className="shadow text-sm font-semibold rounded flex items-center py-2 px-3 min-w-max"
            >
              {selectedSchedule?.id || 'Select a schedule'}
              {' '}
              <FaAngleDown
                className={classNames(
                  'ml-4',
                  open && 'transform rotate-180 transition-transform',
                )}
              />
            </Listbox.Button>
            <FadeTransition>
              <Listbox.Options
                className={classNames(
                  'absolute mt-2 w-full min-w-max shadow-md rounded-lg overflow-hidden border-2 z-30',
                  direction === 'left' && 'right-0',
                  direction === 'center'
                    && 'left-1/2 transform -translate-x-1/2',
                  direction === 'right' && 'left-0',
                )}
              >
                {schedules.length > 0 ? (
                  schedules.sort(compareSemesters).map((schedule) => (
                    <Listbox.Option
                      key={schedule.id}
                      value={schedule}
                      className={optionStyles}
                    >
                      {schedule.id}
                      {' '}
                      (
                      {schedule.classes.length}
                      )
                    </Listbox.Option>
                  ))
                ) : (
                  <Listbox.Option value={null} className={optionStyles}>
                    No schedules
                  </Listbox.Option>
                )}
              </Listbox.Options>
            </FadeTransition>
          </>
        )}
      </Listbox>
    </div>
  );
};

export default ScheduleSelector;
