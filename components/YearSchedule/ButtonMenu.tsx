import Link from 'next/link';
import React, { useRef, useCallback } from 'react';
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
import { Schedule, Season, UserClassData } from '../../shared/firestoreTypes';
import useUserData from '../../src/context/userData';

const buttonStyles = 'p-1 rounded bg-black bg-opacity-0 hover:text-black hover:bg-opacity-50 transition-colors';

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
  const downloadRef = useRef<HTMLAnchorElement>(null!);

  const createNewSchedule = useCallback(
    async (
      title: string,
      // eslint-disable-next-line @typescript-eslint/no-shadow
      year: number,
      // eslint-disable-next-line @typescript-eslint/no-shadow
      season: Season,
      classes: UserClassData[],
      i: number = 0,
    ): Promise<Schedule> => {
      try {
        const newSchedule = await createSchedule(
          `${title}${i ? ` ${i}` : ''}`,
          year,
          season,
          classes,
        );
        return newSchedule;
      } catch (err: any) {
        if (err.message === 'id taken') {
          console.error("Couldn't create schedule, retrying");
          const newSchedule = await createNewSchedule(
            title,
            year,
            season,
            classes,
            i + 1,
          );
          return newSchedule;
        }
        throw err;
      }
    },
    [createSchedule],
  );

  const handleDuplicate = useCallback(async () => {
    if (!selectedSchedule) return;
    try {
      const schedule = await createNewSchedule(
        `${selectedSchedule.id} copy`,
        selectedSchedule.year,
        selectedSchedule.season,
        selectedSchedule.classes,
      );
      selectSchedule(schedule.id);
    } catch (err) {
      console.error(err);
      alert("Couldn't duplicate your schedule. Please try again later.");
    }
  }, [createNewSchedule, selectSchedule, selectedSchedule]);

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
    <div className="flex mx-auto justify-center items-center flex-wrap max-w-[8rem] gap-2 mt-2 text-gray-600 text-xs">
      {selectedSchedule && (
        <>
          <Link
            href={{
              pathname: '/',
              query: { selected: selectedSchedule.id },
            }}
          >
            {/* eslint-disable-next-line jsx-a11y/anchor-is-valid */}
            <a className={buttonStyles} title="Search for classes to add">
              <FaSearch />
            </a>
          </Link>
          <Link
            href={{
              pathname: '/schedule',
              query: { selected: selectedSchedule.id },
            }}
          >
            {/* eslint-disable-next-line jsx-a11y/anchor-is-valid */}
            <a className={buttonStyles} title="Go to calendar view">
              <FaCalendarWeek />
            </a>
          </Link>
          <button
            type="button"
            name="Duplicate schedule"
            title="Duplicate schedule"
            onClick={handleDuplicate}
            className={buttonStyles}
          >
            <FaClone />
          </button>
          <button
            type="button"
            name={editing ? 'Cancel editing' : 'Edit schedule name'}
            title={editing ? 'Cancel editing' : 'Edit schedule name'}
            onClick={async () => {
              if (editing) setEditing(false);
              else {
                setScheduleTitle(selectedSchedule.id);
                setEditing(true);
                process.nextTick(focusInput);
              }
            }}
            className={buttonStyles}
          >
            {editing ? <FaTimes /> : <FaPencilAlt />}
          </button>
        </>
      )}

      <button
        type="button"
        name="Add schedule"
        title="Add schedule"
        onClick={() => {
          createNewSchedule(`${season} ${year}`, year, season, [])
            .then((schedule) => selectSchedule(schedule.id))
            .catch((err) => {
              console.error(err);
              alert("Couldn't create a new schedule!");
            });
        }}
        className={buttonStyles}
      >
        <FaPlus />
      </button>

      {selectedSchedule && (
        <>
          <button
            type="button"
            name="Delete schedule"
            title="Delete schedule"
            onClick={handleDelete}
            className={buttonStyles}
          >
            <FaTrash />
          </button>
          <button
            type="button"
            onClick={() => {
              downloadRef.current.setAttribute(
                'href',
                `data:text/json;charset=utf-8,${encodeURIComponent(
                  JSON.stringify(selectedSchedule, null, 2),
                )}`,
              );
              downloadRef.current.click();
            }}
            className={buttonStyles}
          >
            <FaDownload />
            {/* eslint-disable-next-line jsx-a11y/anchor-has-content, jsx-a11y/anchor-is-valid */}
            <a
              className="hidden"
              ref={downloadRef}
              download={`${selectedSchedule.id} (Plan Crimson).json`}
              title="Download this schedule"
              aria-disabled
            />
          </button>
        </>
      )}
    </div>
  );
};

export default ButtonMenu;
