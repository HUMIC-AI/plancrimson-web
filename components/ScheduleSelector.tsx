import { Listbox } from '@headlessui/react';
import React from 'react';
import { FaAngleDown } from 'react-icons/fa';
import FadeTransition from './FadeTransition';

export interface ScheduleSelectorProps {
  selectedSchedule?: string;
  selectSchedule: React.Dispatch<string>;
}

type Props = ScheduleSelectorProps & { schedules: string[]; };

const ScheduleSelector: React.FC<Props> = function ({ schedules, selectedSchedule, selectSchedule }) {
  return (
    <div className="relative">
      <Listbox
        value={selectedSchedule}
        onChange={selectSchedule}
      >
        <Listbox.Button className="shadow rounded flex items-center py-2 px-3">
          {selectedSchedule || 'Select a schedule'}
          {' '}
          <FaAngleDown className="ml-4" />
        </Listbox.Button>
        <FadeTransition>
          <Listbox.Options className="absolute p-2 rounded mt-2 bg-white bg-opacity-70 shadow z-20">
            {schedules.map((schedule) => (
              <Listbox.Option
                key={schedule}
                value={schedule}
                className="even:bg-white odd:bg-gray-300 bg-opacity-50 py-1 px-2 first:rounded-t last:rounded-b focus:ring-blue-700 focus:ring-2"
              >
                {schedule}
              </Listbox.Option>
            ))}
          </Listbox.Options>
        </FadeTransition>
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
