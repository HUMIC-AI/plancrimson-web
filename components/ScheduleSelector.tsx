/* eslint-disable jsx-a11y/anchor-is-valid */
import { Listbox } from '@headlessui/react';
import Link from 'next/link';
import React, { ReactNode, useEffect, useState } from 'react';
import { FaAngleDown, FaCheckSquare, FaSquare } from 'react-icons/fa';
import { Season } from 'plancrimson-utils';
import { classNames, titleContainsTerm } from 'plancrimson-utils';
import { Auth, Schedules, Settings } from '@/src/features';
import { useAppDispatch, useAppSelector } from '@/src/hooks';
import FadeTransition from './FadeTransition';

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
    <div className="flex w-full flex-col items-center space-y-1">
      <form onSubmit={saveTitle} className="flex w-full px-2">
        <input
          type="text"
          className={classNames(
            'text-sm md:text-base font-medium overflow-auto rounded-md hover:shadow text-center w-full',
            'border-gray-light hover:border-black transition-colors duration-300 border border-b-4 cursor-text',
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

function StyledOption({ children, ...props }: Parameters<typeof Listbox.Option>[0]) {
  return (
    <Listbox.Option {...props} className="px-3 py-1.5 odd:bg-gray-light even:bg-white">
      <span className="cursor-pointer transition-opacity hover:opacity-50">
        {children as ReactNode}
      </span>
    </Listbox.Option>
  );
}

function ChooserOption({ scheduleId }: { scheduleId: string }) {
  const schedule = useAppSelector(Schedules.selectSchedule(scheduleId));
  if (!schedule) return null;
  return (
    <StyledOption
      key={scheduleId}
      value={scheduleId}
    >
      <span className="flex w-min max-w-full space-x-2">
        <span className="grow overflow-auto whitespace-nowrap">
          {schedule.title}
        </span>
        <span>
          (
          {schedule.classes.length}
          )
        </span>
      </span>
    </StyledOption>
  );
}

export interface ScheduleChooserProps {
  chosenScheduleId: string | null;
  handleChooseSchedule: React.Dispatch<string | null>;
  scheduleIds: string[];
  season?: Season;
  year?: number;

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
  season,
  year,
  handleChooseSchedule,
  direction,
  showTerm = 'auto',
  parentWidth,
  showDropdown = false,
  highlight = false,
}: ScheduleChooserProps) {
  const userId = Auth.useAuthProperty('uid');
  const dispatch = useAppDispatch();

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
                className="interactive w-full rounded-xl border px-2 py-1 text-center"
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
              {/* Only show the "no schedules" dialog if not on schedule list on planning page */}
              {scheduleIds.length > 0 ? (
                scheduleIds.map((scheduleId) => <ChooserOption key={scheduleId} scheduleId={scheduleId} />)
              ) : !(year && season) && (
                <StyledOption value={null}>
                  <Link href="/" className="interactive">
                    No schedules. Add one now!
                  </Link>
                </StyledOption>
              )}

              {year && season && (
              <StyledOption
                value={null}
                onClick={async () => {
                  if (!userId) {
                    alert('You must be logged in!');
                    return;
                  }
                  const newSchedule = await dispatch(Schedules.createDefaultSchedule({ season, year }, userId));
                  try {
                    await dispatch(Settings.chooseSchedule({
                      term: `${newSchedule.payload.year}${newSchedule.payload.season}`,
                      scheduleId: newSchedule.payload.id,
                    }));
                  } catch (err) {
                    console.error(err);
                    alert("Couldn't create a new schedule! Please try again later.");
                  }
                }}
              >
                Add new
              </StyledOption>
              )}
            </Listbox.Options>
          </FadeTransition>
        </>
      )}
    </Listbox>
  );
}

export default ScheduleChooser;
