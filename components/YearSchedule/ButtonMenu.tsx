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
            <a className={buttonStyles}>
              <FaSearch />
            </a>
          </Link>
          <Link
            href={{
              pathname: '/semester',
              query: { selected: selectedSchedule.id },
            }}
          >
            {/* eslint-disable-next-line jsx-a11y/anchor-is-valid */}
            <a className={buttonStyles}>
              <FaCalendarWeek />
            </a>
          </Link>
          <button
            type="button"
            onClick={() => createNewSchedule(
              `${selectedSchedule.id} copy`,
              selectedSchedule.year,
              selectedSchedule.season,
              selectedSchedule.classes,
            )
              .then((schedule) => selectSchedule(schedule.id))
              .catch((err) => {
                console.error(err);
                alert(
                  "Couldn't duplicate your schedule. Please try again later.",
                );
              })}
            className={buttonStyles}
          >
            <FaClone />
          </button>
          <button
            type="button"
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
          <button
            type="button"
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
            <FaPlus title="Add schedule" />
          </button>
          <button
            type="button"
            onClick={() => {
              // eslint-disable-next-line no-restricted-globals
              const confirmDelete = confirm(
                `Are you sure you want to delete your schedule ${selectedSchedule.id}?`,
              );
              if (confirmDelete) {
                deleteSchedule(selectedSchedule.id)
                  .then(() => selectSchedule(prevScheduleId))
                  .catch((err) => alert(
                    `There was a problem deleting your schedule: ${err.message}`,
                  ));
              }
            }}
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
            />
          </button>
        </>
      )}
    </div>
  );
};

export default ButtonMenu;
