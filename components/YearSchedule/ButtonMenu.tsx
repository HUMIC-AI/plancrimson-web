import Link from 'next/link';
import React, { useCallback } from 'react';
import {
  FaCalendarWeek,
  FaClone,
  FaPlus,
  FaTrash,
  FaLink,
  FaUnlink,
} from 'react-icons/fa';
import type { IconType } from 'react-icons/lib';
import { Season } from '../../shared/firestoreTypes';
import { Auth, Schedules, Settings } from '../../src/features';
import { useAppDispatch, useAppSelector } from '../../src/hooks';
import Tooltip from '../Tooltip';


const buttonStyles = 'inline-block p-1 rounded bg-black bg-opacity-0 hover:text-black hover:bg-opacity-50 transition-colors';

type BaseProps = {
  name: string;
  Icon: IconType;
};

type ButtonProps = BaseProps & {
  onClick: React.MouseEventHandler<HTMLButtonElement>;
};

type LinkProps = BaseProps & {
  isLink: true;
  pathname: string;
};

// the rest props serve for both buttons and links
function CustomButton({ name, Icon, ...rest }: ButtonProps | LinkProps) {
  if ('isLink' in rest) {
    return (
      <Tooltip text={name} direction="bottom">
        <Link href={rest.pathname}>
          <a className={buttonStyles}>
            <Icon />
          </a>
        </Link>
      </Tooltip>
    );
  }

  return (
    <Tooltip text={name} direction="bottom">
      <button
        type="button"
        name={name}
        onClick={rest.onClick}
        className={buttonStyles}
      >
        <Icon />
      </button>
    </Tooltip>
  );
}


interface ButtonMenuProps {
  chosenScheduleId: string | null;
  handleChooseSchedule: React.Dispatch<string | null>;
  year: number;
  season: Season;
  prevScheduleId: string | null;
}

function ButtonMenu({
  chosenScheduleId,
  handleChooseSchedule,
  year,
  season,
  prevScheduleId,
}: ButtonMenuProps) {
  const dispatch = useAppDispatch();
  const userId = Auth.useAuthProperty('uid');
  const chosenSchedule = useAppSelector(Schedules.selectSchedule(chosenScheduleId));

  const handleDuplicate = useCallback(async () => {
    if (!chosenSchedule) return;
    try {
      const schedule = await dispatch(Schedules.createSchedule({ ...chosenSchedule }));
      handleChooseSchedule(schedule.payload.id);
    } catch (err) {
      console.error(err);
      alert("Couldn't duplicate your schedule. Please try again later.");
    }
  }, [chosenSchedule]);

  const handleDelete = useCallback(async () => {
    if (!chosenSchedule) return;
    const confirmDelete = confirm(
      `Are you sure you want to delete your schedule ${chosenSchedule.title}?`,
    );
    if (!confirmDelete) return;
    try {
      await dispatch(Schedules.deleteSchedule(chosenSchedule.id));
      handleChooseSchedule(prevScheduleId);
    } catch (err) {
      console.error(err);
      alert(
        'There was a problem deleting your schedule. Please try again later.',
      );
    }
  }, [prevScheduleId, chosenSchedule]);

  return (
    <div className="flex flex-col space-y-2 w-full">
      <div className="self-center flex justify-center items-center flex-wrap gap-2 mt-2 text-gray-600 text-xs">
        {chosenSchedule && (
          <>
            <CustomButton
              name="Calendar view"
              isLink
              Icon={FaCalendarWeek}
              pathname={`/schedule/${chosenSchedule.id}`}
            />

            <CustomButton
              name="Duplicate"
              onClick={handleDuplicate}
              Icon={FaClone}
            />
          </>
        )}

        <CustomButton
          name="New schedule"
          onClick={async () => {
            if (!userId) {
              alert('You must be logged in!');
              return;
            }
            const schedule = await dispatch(Schedules.createDefaultSchedule({ season, year }, userId));
            try {
              await dispatch(Settings.chooseSchedule({
                term: `${schedule.payload.year}${schedule.payload.season}`,
                scheduleId: schedule.payload.id,
              }));
            } catch (err) {
              console.error(err);
              alert("Couldn't create a new schedule! Please try again later.");
            }
          }}
          Icon={FaPlus}
        />

        {chosenSchedule && (
          <>
            <CustomButton name="Delete" onClick={handleDelete} Icon={FaTrash} />
            <CustomButton
              name={chosenSchedule.public ? 'Make private' : 'Make public'}
              onClick={() => dispatch(Schedules.setPublic({ scheduleId: chosenSchedule.id, public: !chosenSchedule.public }))}
              Icon={chosenSchedule.public ? FaUnlink : FaLink}
            />
          </>
        )}
      </div>
    </div>
  );
}

export default ButtonMenu;
