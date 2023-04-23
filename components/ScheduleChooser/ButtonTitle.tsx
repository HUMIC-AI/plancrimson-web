import React, { useEffect, useState } from 'react';
import { FaCheckSquare, FaSquare } from 'react-icons/fa';
import { Schedules, Settings } from '@/src/features';
import { useAppDispatch, useAppSelector } from '@/src/utils/hooks';
import { classNames } from '@/src/utils/styles';
import { titleContainsTerm } from 'plancrimson-utils';

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
export function ButtonTitle({
  showTerm, highlight, chosenScheduleId, showDropdown,
}: ButtonTitleProps) {
  const dispatch = useAppDispatch();
  const schedule = useAppSelector(Schedules.selectSchedule(chosenScheduleId));
  const [newTitle, setNewTitle] = useState(schedule?.title || null);
  useEffect(() => {
    setNewTitle(schedule?.title || null);
  }, [schedule]);

  function saveTitle(e: any) {
    e.preventDefault();
    if (!chosenScheduleId || !newTitle || newTitle === chosenScheduleId) { return; }
    dispatch(Schedules.renameSchedule({ scheduleId: chosenScheduleId, title: newTitle }));
  }

  if (!schedule || !newTitle) { return null; }

  const doShowTerm = (() => {
    if (showTerm === 'off') { return false; }
    if (showTerm === 'on') { return true; }
    if (showTerm === 'auto') { return !titleContainsTerm(schedule.title, { season: schedule.season, year: schedule.year }); }
    throw new Error('Invalid value passed to showTerm');
  })();

  return (
    <div className="flex w-full flex-col items-center space-y-1">
      <form onSubmit={saveTitle} className="flex w-full px-2">
        <input
          type="text"
          className={classNames(
            'text-sm md:text-base font-medium text-gray-dark text-center py-1',
            'bg-transparent',
            'hover:border-b focus:border-b focus:text-black focus:outline-none',
            highlight && 'bg-black text-white px-1',
          )}
          value={newTitle}
          onChange={(e) => setNewTitle(e.currentTarget.value)}
          onBlur={saveTitle}
        />

        {!showDropdown && (
          <button
            type="button"
            className="ml-2 w-4"
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
        <span className="text-xs text-gray-light">
          {`${schedule.season} ${schedule.year}`}
        </span>
      )}
    </div>
  );
}
