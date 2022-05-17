import Link from 'next/link';
import React, { useCallback } from 'react';
import {
  FaCalendarWeek,
  FaClone,
  FaPlus,
  FaTrash,
  FaDownload,
  FaLink,
  FaUnlink,
} from 'react-icons/fa';
import type { IconType } from 'react-icons/lib';
import { v4 as uuidv4 } from 'uuid';
import { Season } from '../../shared/firestoreTypes';
import {
  chooseSchedule, createSchedule, deleteSchedule, selectSchedule, togglePublic,
} from '../../src/features/schedules';
import { selectUserUid } from '../../src/features/userData';
import { downloadJson, useAppDispatch, useAppSelector } from '../../src/hooks';
import Tooltip from '../Tooltip';

const buttonStyles = 'inline-block p-1 rounded bg-black bg-opacity-0 hover:text-black hover:bg-opacity-50 transition-colors';

type BaseButtonProps = {
  name: string;
  Icon: IconType;
};

type ButtonProps = BaseButtonProps & {
  onClick: React.MouseEventHandler<HTMLButtonElement>;
};

type LinkProps = BaseButtonProps & {
  isLink: true;
  scheduleId: string;
  pathname: string;
};

function CustomButton({ name, Icon, ...rest }: ButtonProps | LinkProps) {
  if ('isLink' in rest) {
    return (
      <Tooltip text={name} direction="bottom">
        <Link
          href={{
            pathname: rest.pathname,
            query: { selected: rest.scheduleId },
          }}
        >
          {/* eslint-disable-next-line jsx-a11y/anchor-is-valid */}
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
  const userUid = useAppSelector(selectUserUid);
  const chosenSchedule = useAppSelector(selectSchedule(chosenScheduleId));

  const handleDuplicate = useCallback(async () => {
    if (!chosenSchedule) return;
    try {
      const schedule = await dispatch(createSchedule({
        ...chosenSchedule,
        force: true,
      }));
      if ('errors' in schedule.payload) {
        throw new Error(schedule.payload.errors.join(', '));
      }
      handleChooseSchedule(schedule.payload.id);
    } catch (err) {
      console.error(err);
      alert("Couldn't duplicate your schedule. Please try again later.");
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chosenSchedule]);

  const handleDelete = useCallback(async () => {
    if (!chosenSchedule) return;
    // eslint-disable-next-line no-restricted-globals
    const confirmDelete = confirm(
      `Are you sure you want to delete your schedule ${chosenSchedule.title}?`,
    );
    if (!confirmDelete) return;
    try {
      await dispatch(deleteSchedule(chosenSchedule.title));
      handleChooseSchedule(prevScheduleId);
    } catch (err) {
      console.error(err);
      alert(
        'There was a problem deleting your schedule. Please try again later.',
      );
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prevScheduleId, chosenSchedule]);

  return (
    <div className="flex flex-col space-y-2 w-full">
      <div className="self-center flex justify-center items-center flex-wrap gap-2 mt-2 text-gray-600 text-xs">
        {chosenSchedule && (
          <>
            <CustomButton
              name="Calendar view"
              isLink
              scheduleId={chosenSchedule.title}
              Icon={FaCalendarWeek}
              pathname="/schedule"
            />

            <CustomButton
              name="Duplicate"
              onClick={handleDuplicate}
              Icon={FaClone}
            />

            {/* <CustomButton
              name="Clear"
              onClick={() => dispatch(clearSchedule(selectedSchedule.id))}
              Icon={FaEraser}
            /> */}
          </>
        )}

        <CustomButton
          name="New schedule"
          onClick={async () => {
            if (!userUid) {
              alert('You must be logged in!');
              return;
            }
            const schedule = await dispatch(createSchedule({
              id: uuidv4(),
              title: `${season} ${year}`,
              year,
              season,
              classes: [],
              ownerUid: userUid,
              public: false,
              force: true,
            }));
            try {
              if ('errors' in schedule.payload) {
                throw new Error(schedule.payload.errors.join(', '));
              }
              await dispatch(chooseSchedule({
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
              name="Download schedule"
              onClick={() => downloadJson(
                `${chosenSchedule.title} (Plan Crimson)`,
                { schedules: [chosenSchedule] },
              )}
              Icon={FaDownload}
            />
            <CustomButton
              name={chosenSchedule.public ? 'Make private' : 'Make public'}
              onClick={() => dispatch(togglePublic(chosenSchedule.id))}
              Icon={chosenSchedule.public ? FaUnlink : FaLink}
            />
          </>
        )}
      </div>
    </div>
  );
}

export default ButtonMenu;
