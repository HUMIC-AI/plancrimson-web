import { Listbox } from '@headlessui/react';
import React from 'react';
import { FaAngleDown } from 'react-icons/fa';
import { classNames } from '../src/util';
import FadeTransition from './FadeTransition';

export interface ScheduleSelectorProps {
  selectedSchedule: string | null;
  selectSchedule: React.Dispatch<string | null>;
  schedules: string[];
}

const ScheduleSelector: React.FC<ScheduleSelectorProps> = function ({ schedules, selectedSchedule, selectSchedule }) {
  return (
    <div className="relative inline-block">
      <Listbox
        value={selectedSchedule}
        onChange={selectSchedule}
      >
        {({ open }) => (
          <>
            <Listbox.Button className={classNames(
              schedules.length === 0 && 'cursor-not-allowed text-gray-700 bg-gray-300',
              'shadow text-sm font-semibold rounded flex items-center py-2 px-3 min-w-max',
            )}
            >
              {selectedSchedule || 'Select a schedule'}
              {' '}
              <FaAngleDown className={classNames(
                'ml-4',
                open && 'transform rotate-180 transition-transform',
              )}
              />
            </Listbox.Button>
            {schedules.length > 0 && (
            <FadeTransition>
              <Listbox.Options className="absolute mt-2 w-full shadow z-20">
                {schedules.map((schedule) => (
                  <Listbox.Option
                    key={schedule}
                    value={schedule}
                    className="even:bg-white w-full cursor-default odd:bg-gray-300 bg-opacity-50 py-2 px-3 first:rounded-t last:rounded-b focus:ring-blue-700 focus:ring-2"
                  >
                    {schedule}
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

// const ScheduleSelector: React.FC<Props> = function ({ schedules, selectedSchedule, selectSchedule }) {
//   const isSelected = (schedule: Schedule) => selectedSchedule?.id === schedule.id;

//   return (
//     <div>
//       <h2>
//         Semesters:
//       </h2>

//       <div className="flex flex-col sm:flex-row gap-2">
//         {schedules.map((schedule) => (
//           <button
//             key={schedule.id}
//             type="button"
//             onClick={() => {
//               selectSchedule(schedule);
//             }}
//             className={`${isSelected(schedule) ? 'bg-green-300 hover:bg-green-500' : 'bg-blue-300 hover:bg-blue-500'}
//               p-2 rounded-md text-sm transition-colors shadow`}
//           >
//             <p>
//               {`${schedule.id} (${schedule.classes.length})`}
//             </p>
//             <p className="text-xs mt-1">
//               {`${schedule.season} ${schedule.year}`}
//             </p>
//           </button>
//         ))}
//       </div>
//     </div>
//   );
// };

export default ScheduleSelector;
