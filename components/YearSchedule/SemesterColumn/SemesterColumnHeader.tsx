import {
  Auth, Planner, Schedules, Settings,
} from '@/src/features';
import { selectSchedule, selectSchedules } from '@/src/features/schedules';
import { useAppDispatch, useAppSelector } from '@/src/utils/hooks';
import { classNames } from '@/src/utils/styles';
import { Listbox, Menu } from '@headlessui/react';
import { Term, semesterToTerm, termToSemester } from '@/src/lib';
import { useCallback, useState } from 'react';
import {
  FaCalendar, FaCog, FaEdit, FaEyeSlash, FaGlobe,
} from 'react-icons/fa';
import FadeTransition from '@/components/Utils/FadeTransition';
import { ScheduleId, ScheduleIdOrSemester } from '@/src/types';
import { getSchedulesBySemester } from '@/src/utils/schedules';
import Link from 'next/link';
import { DeleteScheduleButton } from './DeleteScheduleButton';
import { DuplicateScheduleButton } from './DuplicateScheduleButton';
import { MenuButton } from './MenuButton';
import { EditNameForm } from './EditNameForm';
import { HideScheduleButton } from './HideScheduleButton';
import { useScheduleFromScheduleIdOrSemester } from './useScheduleFromScheduleIdOrSemester';

export default function HeaderSection({ s }: { s: ScheduleIdOrSemester }) {
  const dispatch = useAppDispatch();
  const { schedule, semester } = useScheduleFromScheduleIdOrSemester(s);
  const semesterFormat = useAppSelector(Planner.selectSemesterFormat);
  const [editing, setEditing] = useState(false);

  return (
    <Menu as="div" className="relative flex flex-col items-center px-2">
      {({ open }) => (
        <>
          <div className="group/column relative mx-4 p-2">
            {(schedule && editing) ? (
              <EditNameForm
                title={schedule.title}
                setEditing={setEditing}
                handleSubmit={(title) => (title
                  ? dispatch(Schedules.renameSchedule({ scheduleId: schedule.id, title }))
                  : Promise.reject(new Error('Invalid title')))}
              />
            ) : (
              <TitleComponent
                scheduleId={schedule ? schedule.id : null}
                term={semesterToTerm(semester!)}
                setEditing={setEditing}
              />
            )}

            {schedule && (
              <button
                type="button"
                className="absolute right-full top-1/2 -translate-y-1/2 text-gray-primary opacity-50 transition-opacity hover:opacity-100"
                onClick={() => dispatch(Schedules.setPublic({ scheduleId: schedule.id, public: !schedule.public }))}
                title={schedule.public ? 'Make private' : 'Make public'}
              >
                {schedule.public ? (
                  <FaGlobe />
                ) : (
                  <FaEyeSlash />
                )}
              </button>
            )}

            <Menu.Button className={classNames(
              'absolute left-full top-1/2 -translate-y-1/2 transition focus:outline-none focus:text-accent',
              !open && 'opacity-0 group-hover/column:opacity-100 hover:text-accent',
            )}
            >
              <span className="sr-only">Settings</span>
              <FaCog />
            </Menu.Button>
          </div>

          <FadeTransition>
            <Menu.Items className="menu-dropdown absolute top-full z-10">
              {schedule && <MenuButton href={`/schedule/${schedule.id}`} Icon={FaCalendar} title="Calendar" />}
              {semesterFormat !== 'sample' && schedule && (
              <MenuButton onClick={() => { setEditing(true); }} Icon={FaEdit} title="Rename" />
              )}
              <HideScheduleButton s={s} />
              {semesterFormat !== 'sample' && schedule && (
              <>
                <DeleteScheduleButton scheduleId={schedule.id} />
                <DuplicateScheduleButton scheduleId={schedule.id} />
              </>
              )}
            </Menu.Items>
          </FadeTransition>
        </>
      )}
    </Menu>
  );
}

type TitleComponentProps = {
  scheduleId: ScheduleId | null;
  term: Term;
  setEditing: (editing: boolean) => void;
};

function TitleComponent({ scheduleId, term, setEditing }: TitleComponentProps) {
  const schedule = useAppSelector(selectSchedule(scheduleId));

  return schedule ? (
    <Link
      href={{
        pathname: '/schedule/[scheduleId]',
        query: { scheduleId },
      }}
      className="text-center text-lg font-medium"
    >
      {schedule.title}
    </Link>
  ) : 'Loading...';
}

/**
 * Part of the {@link SemesterColumnHeader} component.
 * @deprecated
 */
function OldTitleComponent({ scheduleId: id, term, setEditing }: TitleComponentProps) {
  const dispatch = useAppDispatch();
  const semesterFormat = useAppSelector(Planner.selectSemesterFormat);
  const userId = Auth.useAuthProperty('uid');
  const schedules = useAppSelector(selectSchedules);
  const termSchedules = getSchedulesBySemester(schedules, termToSemester(term));
  const [justCreated, setJustCreated] = useState<string | null>(null);

  const chooseNewSchedule = useCallback(async (scheduleId: string | null) => {
    if (scheduleId !== null) {
      await dispatch(Settings.chooseSchedule({
        term,
        scheduleId,
      }));
      return;
    }

    try {
      if (!userId) throw new Error('User is not logged in');
      const newSchedule = Schedules.getDefaultSchedule(termToSemester(term), userId);
      setJustCreated(newSchedule.id);
      await dispatch(Schedules.createSchedule(newSchedule));
      await dispatch(Settings.chooseSchedule({
        term,
        scheduleId: newSchedule.id,
      }));
      setEditing(true);
    } catch (err) {
      console.error(err);
      alert("Couldn't create a new schedule! Please try again later.");
    }
  }, [term, userId]);

  const title = (id && id in schedules) ? schedules[id].title : 'None';

  // don't show the dropdown if all schedules are being shown
  if (semesterFormat === 'all') {
    return <p className="text-center text-lg font-medium">{title}</p>;
  }

  return (
    <Listbox
      as="div"
      className="relative flex flex-col items-center"
      onChange={chooseNewSchedule}
    >
      <Listbox.Button className="select-none rounded px-2 text-center text-lg font-medium transition-colors hover:bg-gray-primary/50">
        {title}
      </Listbox.Button>
      <FadeTransition>
        <Listbox.Options className="menu-dropdown absolute top-full z-10 mt-2 w-max divide-y">
          {termSchedules.map((schedule) => schedule.id !== justCreated && (
            <Listbox.Option key={schedule.id} value={schedule.id} className="menu-button select-none first:rounded-t">
              {schedule.title}
            </Listbox.Option>
          ))}
          <Listbox.Option value={null} className="menu-button select-none rounded-b">
            Create new
          </Listbox.Option>
        </Listbox.Options>
      </FadeTransition>
    </Listbox>
  );
}

