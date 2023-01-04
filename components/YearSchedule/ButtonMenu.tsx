import Link from 'next/link';
import React, { useCallback } from 'react';
import {
  FaCalendarWeek,
  FaClone,
  FaTrash,
  FaLink,
  FaUnlink,
} from 'react-icons/fa';
import type { IconType } from 'react-icons/lib';
import { v4 as uuidv4 } from 'uuid';
import { Schedules } from '../../src/features';
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
        <Link href={rest.pathname} className={buttonStyles}>
          <Icon />
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
  prevScheduleId: string | null;
}

export default function ButtonMenu({
  chosenScheduleId,
  handleChooseSchedule,
  prevScheduleId,
}: ButtonMenuProps) {
  const dispatch = useAppDispatch();
  const chosenSchedule = useAppSelector(Schedules.selectSchedule(chosenScheduleId));

  const handleDuplicate = useCallback(async () => {
    if (!chosenSchedule) return;
    try {
      const schedule = await dispatch(Schedules.createSchedule({ ...chosenSchedule, id: uuidv4(), title: `${chosenSchedule.title} copy` }));
      handleChooseSchedule(schedule.payload.id);
    } catch (err) {
      console.error('error duplicating schedule:', err);
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
    <div className="flex w-full flex-col space-y-2">
      <div className="mt-2 flex flex-wrap items-center justify-center gap-2 self-center text-xs text-gray-600">
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
