import { Listbox } from '@headlessui/react';
import Link from 'next/link';
import React from 'react';
import { FaAngleDown } from 'react-icons/fa';
import { Auth, Schedules, Settings } from '@/src/features';
import { useAppDispatch } from '@/src/utils/hooks';
import { classNames } from '@/src/utils/styles';
import { Season, semesterToTerm } from '@/src/lib';
import FadeTransition from '../Utils/FadeTransition';
import { ButtonTitle } from './ButtonTitle';
import { StyledOption } from './StyledOption';
import { ChooserOption } from './ChooserOption';
import { MESSAGES } from '../../src/utils/config';
import { useChooseSchedule } from '../../src/context/selectedSchedule';

export interface ScheduleChooserProps {
  chosenScheduleId: string | null;
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
export default function ScheduleChooser({
  scheduleIds,
  chosenScheduleId,
  season,
  year,
  direction,
  showTerm = 'auto',
  parentWidth,
  showDropdown = false,
  highlight = false,
}: ScheduleChooserProps) {
  const userId = Auth.useAuthProperty('uid');
  const dispatch = useAppDispatch();
  const chooseSchedule = useChooseSchedule();

  // if we're showing all schedules, don't render a dropdown menu
  // instead just have the title be clickable to select
  if (!showDropdown) {
    if (!chosenScheduleId) {
      return (
        <span className="text-center">
          No schedule selected
        </span>
      );
    }

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
      onChange={chooseSchedule}
      as="div"
      className="relative"
    >
      {({ open }) => (
        <>
          {chosenScheduleId
            ? (
              <div className="flex w-full rounded border border-gray-primary">
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
                className="interactive w-full rounded-xl border border-gray-primary px-2 py-1 text-center"
              >
                Select a schedule
              </Listbox.Button>
            )}
          <FadeTransition>
            <Listbox.Options
              className={classNames(
                'absolute mt-2 rounded-lg overflow-hidden border-2 border-gray-primary z-30',
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
                    alert(MESSAGES.login);
                    return;
                  }
                  const newSchedule = await dispatch(Schedules.createDefaultSchedule({ season, year }, userId));
                  try {
                    await dispatch(Settings.chooseSchedule({
                      term: semesterToTerm(newSchedule.payload),
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
