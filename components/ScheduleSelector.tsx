/* eslint-disable jsx-a11y/anchor-is-valid */
import { Listbox } from '@headlessui/react';
import React, { useEffect, useState } from 'react';
import { FaAngleDown, FaCheckSquare, FaSquare } from 'react-icons/fa';
import { Semester } from '../shared/types';
import { classNames } from '../shared/util';
import { Schedules, Settings } from '../src/features';
import { useAppDispatch, useAppSelector } from '../src/hooks';
import FadeTransition from './FadeTransition';

function titleContainsTerm(title: string, term: Semester) {
  const titleLower = title.toLowerCase();
  return (
    titleLower.includes(term.season.toLowerCase())
    && titleLower.includes(term.year.toString())
  );
}

interface ButtonTitleProps {
  showTerm: 'on' | 'off' | 'auto';
  highlight: boolean;
  chosenScheduleId: string;
  showDropdown: boolean;
}

/**
 * The component inside the Listbox in the ScheduleSelector
 *
 * @param showTerm whether or not to show the term (season, year) of the selected schedule
 * @param highlight whether to highlight this schedule
 * @param chosenScheduleId the ID of this schedule
 * @param showDropdown whether to show the dropdown
 */
function ButtonTitle({
  showTerm,
  highlight,
  chosenScheduleId,
  showDropdown,
}: ButtonTitleProps) {
  const dispatch = useAppDispatch();
  const schedule = useAppSelector(Schedules.selectSchedule(chosenScheduleId));
  const [newTitle, setNewTitle] = useState(schedule?.title || null);
  useEffect(() => {
    setNewTitle(schedule?.title || null);
  }, [schedule]);

  function saveTitle(e: any) {
    e.preventDefault();
    if (!chosenScheduleId || !newTitle || newTitle === chosenScheduleId) return;
    dispatch(Schedules.renameSchedule({ scheduleId: chosenScheduleId, title: newTitle }));
  }

  if (!schedule || !newTitle) return null;

  const doShowTerm = (() => {
    if (showTerm === 'off') return false;
    if (showTerm === 'on') return true;
    if (showTerm === 'auto') return !titleContainsTerm(schedule.title, { season: schedule.season, year: schedule.year });
    throw new Error('Invalid value passed to showTerm');
  })();

  return (
    <div className="flex flex-col items-center space-y-1 w-full">
      <form onSubmit={saveTitle} className="flex px-2 w-full">
        <input
          type="text"
          className={classNames(
            'text-sm md:text-base font-medium overflow-auto rounded-md hover:shadow text-center w-full',
            'border-gray-400 hover:border-black transition-colors duration-300 border border-b-4 cursor-text',
            highlight && 'bg-gray-800 text-white px-1',
          )}
          value={newTitle}
          onChange={(e) => setNewTitle(e.currentTarget.value)}
          onBlur={saveTitle}
        />
        {!showDropdown && (
        <button
          type="button"
          className="w-4 ml-2"
          onClick={() => dispatch(Settings.chooseSchedule({
            term: `${schedule.year}${schedule.season}`,
            scheduleId: schedule?.title || null,
          }))}
        >
          {highlight ? <FaCheckSquare /> : <FaSquare />}
        </button>
        )}
      </form>

      {doShowTerm && (
      <span className="text-xs text-gray-400">
        {`${schedule.season} ${schedule.year}`}
      </span>
      )}
    </div>
  );
}

function ChooserOption({ scheduleId }: { scheduleId: string }) {
  const schedule = useAppSelector(Schedules.selectSchedule(scheduleId));
  if (!schedule) return null;
  return (
    <Listbox.Option
      key={scheduleId}
      value={scheduleId}
      className="odd:bg-gray-200 even:bg-white cursor-default py-1.5 px-3"
    >
      <span className="flex space-x-2 w-min max-w-full">
        <span className="flex-grow whitespace-nowrap overflow-auto">
          {schedule.title}
        </span>
        <span>
          (
          {schedule.classes.length}
          )
        </span>
      </span>
    </Listbox.Option>
  );
}

export interface ScheduleChooserProps {
  chosenScheduleId: string | null;
  handleChooseSchedule: React.Dispatch<string | null>;
  scheduleIds: string[];

  // the direction to expand the selector
  direction: 'left' | 'center' | 'right';

  // whether to show the term of the current schedule. default 'auto'.
  // 'auto' will show the term iff the title does not include the term.
  showTerm?: 'on' | 'off' | 'auto';

  // the width of the parent container
  parentWidth?: string;

  // whether to highlight this schedule chooser. default false.
  highlight?: boolean;

  // whether to show an actual dropdown menu.
  // ie if showing all schedules, we don't show the dropdown.
  showDropdown?: boolean;
}
/**
 * A dropdown for choosing a schedule from a list of possible schedules.
 * @param scheduleIds the list of schedules to choose from
 * @param chosenScheduleId the currently chosen schedule
 * @param handleChooseSchedule the callback when a schedule is chosen
 */
function ScheduleChooser({
  scheduleIds,
  chosenScheduleId,
  handleChooseSchedule,
  direction,
  showTerm = 'auto',
  parentWidth,
  showDropdown = false,
  highlight = false,
}: ScheduleChooserProps) {
  // if we're showing all schedules, don't render a dropdown menu
  // instead just have the title be clickable to select
  if (!showDropdown) {
    if (!chosenScheduleId) return <span className="text-center">No schedule selected</span>;
    return (
      <ButtonTitle
        chosenScheduleId={chosenScheduleId}
        showTerm={showTerm}
        highlight={highlight}
        showDropdown={false}
      />
    );
  }

  return (
    <Listbox
      value={chosenScheduleId}
      onChange={handleChooseSchedule}
      as="div"
      className="relative"
    >
      {({ open }) => (
        <>
          {chosenScheduleId
            ? (
              <div className="flex w-full">
                <ButtonTitle
                  showTerm={showTerm}
                  chosenScheduleId={chosenScheduleId}
                  highlight={highlight}
                  showDropdown
                />
                <Listbox.Button name="Select schedule">
                  <FaAngleDown
                    className={classNames(
                      open && 'transform rotate-180 transition-transform',
                      'w-4',
                    )}
                  />
                </Listbox.Button>
              </div>
            )
            : (
              <Listbox.Button
                name="Select schedule"
                className="text-center w-full border rounded-xl py-1 px-2 interactive"
              >
                Select a schedule
              </Listbox.Button>
            )}
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
              {scheduleIds.length > 0 ? (
                scheduleIds.map((scheduleId) => <ChooserOption key={scheduleId} scheduleId={scheduleId} />)
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
  );
}

export default ScheduleChooser;
