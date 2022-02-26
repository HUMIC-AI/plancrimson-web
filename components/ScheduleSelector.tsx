/* eslint-disable jsx-a11y/anchor-is-valid */
import { Listbox } from '@headlessui/react';
import { useRouter } from 'next/router';
import React, { useState } from 'react';
import { FaAngleDown, FaCheckSquare, FaSquare } from 'react-icons/fa';
import { Schedule, Semester } from '../shared/firestoreTypes';
import { classNames, compareSemesters } from '../shared/util';
import { useAppDispatch, useAppSelector } from '../src/app/hooks';
import { renameSchedule, selectSchedule } from '../src/features/schedules';
import { selectSemesterFormat } from '../src/features/semesterFormat';
import FadeTransition from './FadeTransition';

export interface ScheduleSelectorProps {
  selectedSchedule: Schedule | null;
  selectSchedule: React.Dispatch<Schedule | null>;
  schedules: Schedule[];
  direction: 'left' | 'center' | 'right';
  showTerm?: boolean;
  parentWidth?: string;
  highlight?: boolean;
}

function titleContainsTerm(title: string, term: Semester) {
  const titleLower = title.toLowerCase();
  return (
    titleLower.includes(term.season.toLowerCase())
    && titleLower.includes(term.year.toString())
  );
}

/**
 * The component inside the Listbox in the ScheduleSelector
 */
function ButtonTitle({
  showTerm,
  selectedSchedule,
  highlight,
}: {
  showTerm: boolean | undefined;
  highlight: boolean;
  selectedSchedule: Schedule | null;
}) {
  const dispatch = useAppDispatch();
  const [value, setValue] = useState(selectedSchedule?.id || '');
  const disabled = !selectedSchedule;

  function saveTitle(e: any) {
    e.preventDefault();
    if (!selectedSchedule?.id || value === selectedSchedule.id) return;
    dispatch(renameSchedule({ oldId: selectedSchedule.id, newId: value }));
  }

  return (
    <div className="flex flex-col items-center space-y-1">
      <form onSubmit={saveTitle} className="flex px-2 w-full">
        <input
          type="text"
          className={classNames(
            'pl-2 text-sm md:text-base font-medium overflow-auto text-center',
            !disabled && 'border-gray-400 hover:border-black transition-colors duration-300 border-b-4 cursor-text',
            highlight && 'bg-gray-800 rounded text-white px-1',
          )}
          value={selectedSchedule ? value : 'Select a schedule'}
          onChange={(e) => {
            if (disabled) return;
            setValue(e.currentTarget.value);
          }}
          onBlur={saveTitle}
          disabled={disabled}
        />
        {selectedSchedule && (
        <button
          type="button"
          className="w-4 ml-2"
          onClick={() => dispatch(selectSchedule({
            term: `${selectedSchedule.year}${selectedSchedule.season}`,
            scheduleId: selectedSchedule?.id || null,
          }))}
        >
          {highlight ? <FaCheckSquare /> : <FaSquare />}
        </button>
        )}
      </form>

      {showTerm !== false
        && selectedSchedule
        && (showTerm
          || !titleContainsTerm(selectedSchedule.id, selectedSchedule)) && (
          <span className="text-xs text-gray-400">
            {selectedSchedule.season}
            {' '}
            {selectedSchedule.year}
          </span>
      )}
    </div>
  );
}

const ScheduleSelector: React.FC<ScheduleSelectorProps> = function ({
  schedules,
  selectedSchedule,
  selectSchedule: select,
  direction,
  showTerm,
  parentWidth,
  highlight = false,
}) {
  const { pathname } = useRouter();
  const semesterFormat = useAppSelector(selectSemesterFormat);
  const optionStyles = 'flex space-x-2 w-min max-w-full';

  // if we're showing all schedules, don't render a dropdown menu
  // instead just have the title be clickable to select
  if (pathname === '/plan' && semesterFormat === 'all') {
    return (
      <ButtonTitle
        selectedSchedule={selectedSchedule}
        showTerm={showTerm}
        highlight={highlight}
      />
    );
  }

  return (
    <div className="flex flex-col items-center">
      <Listbox
        value={selectedSchedule}
        onChange={select}
        as="div"
        className="relative inline-block"
      >
        {({ open }) => (
          <>
            <div className="shadow border rounded flex items-center py-2 px-3 min-w-max space-x-2">
              <ButtonTitle
                showTerm={showTerm}
                selectedSchedule={selectedSchedule}
                highlight={highlight}
              />
              <Listbox.Button
                name="Select schedule"
              >
                <FaAngleDown
                  className={classNames(
                    open && 'transform rotate-180 transition-transform',
                    'w-4',
                  )}
                />
              </Listbox.Button>
            </div>
            <FadeTransition>
              <Listbox.Options
                className={classNames(
                  'absolute mt-2 shadow-md rounded-lg overflow-hidden border-2 z-30',
                  direction === 'left' && 'right-0',
                  direction === 'center'
                    && 'left-1/2 transform -translate-x-1/2',
                  direction === 'right' && 'left-0',
                )}
                style={{
                  maxWidth: parentWidth
                    ? `calc(${parentWidth} - 2rem)`
                    : '16rem',
                }}
              >
                {schedules.length > 0 ? (
                  schedules.sort(compareSemesters).map((schedule) => (
                    <Listbox.Option
                      key={schedule.id}
                      value={schedule}
                      className="odd:bg-gray-200 even:bg-white cursor-default py-1.5 px-3"
                    >
                      <span className={optionStyles}>
                        <span className="flex-grow whitespace-nowrap overflow-auto">
                          {schedule.id}
                        </span>
                        <span>
                          (
                          {schedule.classes.length}
                          )
                        </span>
                      </span>
                    </Listbox.Option>
                  ))
                ) : (
                  <Listbox.Option
                    value={null}
                    className="w-full py-1.5 px-2 whitespace-nowrap bg-white"
                  >
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
