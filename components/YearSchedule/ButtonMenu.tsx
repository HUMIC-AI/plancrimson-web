import Link from 'next/link';
import React, { useCallback } from 'react';
import {
  FaSearch,
  FaCalendarWeek,
  FaClone,
  FaTimes,
  FaPencilAlt,
  FaPlus,
  FaTrash,
  FaDownload,
} from 'react-icons/fa';
import type { IconType } from 'react-icons/lib';
import { Schedule, Season } from '../../shared/firestoreTypes';
import useUserData from '../../src/context/userData';
import { downloadJson } from '../../src/hooks';
import Tooltip from '../Tooltip';

type Props = {
  selectedSchedule: Schedule | null;
  selectSchedule: React.Dispatch<string | null>;
  editing: boolean;
  setEditing: React.Dispatch<boolean>;
  setScheduleTitle: React.Dispatch<string>;
  focusInput: () => void;

  year: number;
  season: Season;
  prevScheduleId: string | null;
};

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

const ButtonMenu: React.FC<Props> = function ({
  selectedSchedule,
  selectSchedule,
  editing,
  setEditing,
  setScheduleTitle,
  focusInput,
  year,
  season,
  prevScheduleId,
}) {
  const { createSchedule, deleteSchedule } = useUserData();

  const handleEditing = async () => {
    if (!selectedSchedule) return;
    if (editing) setEditing(false);
    else {
      setScheduleTitle(selectedSchedule.id);
      setEditing(true);
      process.nextTick(focusInput);
    }
  };

  const handleDuplicate = useCallback(async () => {
    if (!selectedSchedule) return;
    try {
      const schedule = await createSchedule({
        ...selectedSchedule,
        force: true,
      });
      selectSchedule(schedule.id);
    } catch (err) {
      console.error(err);
      alert("Couldn't duplicate your schedule. Please try again later.");
    }
  }, [createSchedule, selectSchedule, selectedSchedule]);

  const handleDelete = useCallback(async () => {
    if (!selectedSchedule) return;
    // eslint-disable-next-line no-restricted-globals
    const confirmDelete = confirm(
      `Are you sure you want to delete your schedule ${selectedSchedule.id}?`,
    );
    if (!confirmDelete) return;
    try {
      await deleteSchedule(selectedSchedule.id);
      selectSchedule(prevScheduleId);
    } catch (err) {
      console.error(err);
      alert(
        'There was a problem deleting your schedule. Please try again later.',
      );
    }
  }, [deleteSchedule, prevScheduleId, selectSchedule, selectedSchedule]);

  return (
    <div className="flex flex-col space-y-2 w-full">
      <div className="self-center flex justify-center items-center flex-wrap max-w-[8rem] gap-2 mt-2 text-gray-600 text-xs">
        {selectedSchedule && (
          <>
            <CustomButton
              name="Add courses"
              isLink
              scheduleId={selectedSchedule.id}
              pathname="/"
              Icon={FaSearch}
            />

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

            <CustomButton
              name={editing ? 'Cancel editing' : 'Edit name'}
              onClick={handleEditing}
              Icon={editing ? FaTimes : FaPencilAlt}
            />
          </>
        )}

        <CustomButton
          name="New schedule"
          onClick={() => {
            createSchedule({
              id: `${season} ${year}`,
              year,
              season,
              force: true,
            })
              .then((schedule) => selectSchedule(schedule.id))
              .catch((err) => {
                console.error(err);
                alert("Couldn't create a new schedule!");
              });
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
                selectedSchedule,
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
