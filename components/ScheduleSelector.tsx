/* eslint-disable jsx-a11y/anchor-is-valid */
import { Listbox } from '@headlessui/react';
import React, { useCallback } from 'react';
import { FaAngleDown } from 'react-icons/fa';
import { Schedule, Semester } from '../shared/firestoreTypes';
import { classNames, compareSemesters } from '../shared/util';
import useShowAllSchedules from '../src/context/showAllSchedules';
import FadeTransition from './FadeTransition';

export interface ScheduleSelectorProps {
  selectedSchedule: Schedule | null;
  selectSchedule: React.Dispatch<Schedule | null>;
  schedules: Schedule[];
  direction: 'left' | 'center' | 'right';
  showTerm?: boolean;
  parentWidth?: string;
  highlight?: boolean;
  onPlanningPage?: boolean;
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
  parentWidth,
  showTerm,
  selectedSchedule,
  highlight,
  selectSchedule,
}: {
  parentWidth: string | undefined;
  showTerm: boolean | undefined;
  highlight: boolean;
  selectedSchedule: Schedule | null;
  selectSchedule?: React.Dispatch<Schedule | null>;
}) {
  const { showAllSchedules } = useShowAllSchedules();

  const TitleComponent: React.FC<React.HTMLAttributes<unknown>> = useCallback(
    ({ children, ...props }) => {
      // if we're showing all schedules, click on the title to select schedule
      // otherwise selection is handled by ScheduleSelector
      if (showAllSchedules !== 'all') {
        return <span {...props}>{children}</span>;
      }
      return (
        <button
          type="button"
          onClick={() => selectSchedule!(selectedSchedule)}
          {...props}
        >
          {children}
        </button>
      );
    },
    [selectSchedule, selectedSchedule, showAllSchedules],
  );

  return (
    <span className="flex flex-col items-center space-y-1">
      <TitleComponent
        className={classNames(
          'text-sm md:text-base font-medium whitespace-nowrap overflow-auto',
          highlight && 'bg-gray-800 rounded text-white px-1',
        )}
        style={{
          maxWidth: parentWidth ? `calc(${parentWidth} - 4rem)` : '8rem',
        }}
      >
        {selectedSchedule?.id || 'Select a schedule'}
      </TitleComponent>
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
    </span>
  );
}

const ScheduleSelector: React.FC<ScheduleSelectorProps> = function ({
  schedules,
  selectedSchedule,
  selectSchedule,
  direction,
  showTerm,
  parentWidth,
  highlight = false,
  onPlanningPage = false,
}) {
  const optionStyles = 'flex space-x-2 w-min max-w-full';
  const { showAllSchedules } = useShowAllSchedules();

  // if we're showing all schedules, don't render a dropdown menu
  // instead just have the title be clickable to select
  if (onPlanningPage && showAllSchedules === 'all') {
    return (
      <ButtonTitle
        parentWidth={`${parentWidth} + 2rem`}
        selectedSchedule={selectedSchedule}
        showTerm={showTerm}
        highlight={highlight}
        selectSchedule={selectSchedule}
      />
    );
  }

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
              className="shadow border rounded flex items-center py-2 px-3 min-w-max space-x-2"
            >
              <ButtonTitle
                parentWidth={parentWidth}
                showTerm={showTerm}
                selectedSchedule={selectedSchedule}
                highlight={highlight}
              />
              <FaAngleDown
                className={classNames(
                  open && 'transform rotate-180 transition-transform',
                  'w-4',
                )}
              />
            </Listbox.Button>
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
