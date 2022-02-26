import Link from 'next/link';
import React, { useCallback } from 'react';
import {
  FaCalendarWeek,
  FaClone,
  FaPlus,
  FaTrash,
  FaDownload,
} from 'react-icons/fa';
import type { IconType } from 'react-icons/lib';
import { Schedule, Season } from '../../shared/firestoreTypes';
import { useAppDispatch } from '../../src/app/hooks';
import { createSchedule, deleteSchedule } from '../../src/features/schedules';
import { downloadJson } from '../../src/hooks';
import Tooltip from '../Tooltip';

interface ButtonMenuProps {
  selectedSchedule: Schedule | null;
  selectSchedule: React.Dispatch<string | null>;
  year: number;
  season: Season;
  prevScheduleId: string | null;
}

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

const ButtonMenu: React.FC<ButtonMenuProps> = function ({
  selectedSchedule,
  selectSchedule,
  year,
  season,
  prevScheduleId,
}) {
  const dispatch = useAppDispatch();

  const handleDuplicate = useCallback(async () => {
    if (!selectedSchedule) return;
    try {
      const schedule = await dispatch(createSchedule({
        ...selectedSchedule,
        force: true,
      }));
      if ('errors' in schedule.payload) {
        throw new Error(schedule.payload.errors.join(', '));
      }
      selectSchedule(schedule.payload.id);
    } catch (err) {
      console.error(err);
      alert("Couldn't duplicate your schedule. Please try again later.");
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedSchedule]);

  const handleDelete = useCallback(async () => {
    if (!selectedSchedule) return;
    // eslint-disable-next-line no-restricted-globals
    const confirmDelete = confirm(
      `Are you sure you want to delete your schedule ${selectedSchedule.id}?`,
    );
    if (!confirmDelete) return;
    try {
      await dispatch(deleteSchedule(selectedSchedule.id));
      selectSchedule(prevScheduleId);
    } catch (err) {
      console.error(err);
      alert(
        'There was a problem deleting your schedule. Please try again later.',
      );
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prevScheduleId, selectedSchedule]);

  return (
    <div className="flex flex-col space-y-2 w-full">
      <div className="self-center flex justify-center items-center flex-wrap gap-2 mt-2 text-gray-600 text-xs">
        {selectedSchedule && (
          <>
            <CustomButton
              name="Calendar view"
              isLink
              scheduleId={selectedSchedule.id}
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
            const schedule = await dispatch(createSchedule({
              id: `${season} ${year}`,
              year,
              season,
              classes: [],
              force: true,
            }));
            try {
              if ('errors' in schedule.payload) {
                throw new Error(schedule.payload.errors.join(', '));
              }
            } catch (err) {
              console.error(err);
              alert("Couldn't create a new schedule! Please try again later.");
            }
          }}
          Icon={FaPlus}
        />

        {selectedSchedule && (
          <>
            <CustomButton name="Delete" onClick={handleDelete} Icon={FaTrash} />
            <CustomButton
              name="Download schedule"
              onClick={() => downloadJson(
                `${selectedSchedule.id} (Plan Crimson)`,
                { schedules: [selectedSchedule] },
              )}
              Icon={FaDownload}
            />
          </>
        )}
      </div>
    </div>
  );
};

export default ButtonMenu;
