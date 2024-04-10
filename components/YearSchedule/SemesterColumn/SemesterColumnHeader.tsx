import {
  Auth, Planner, Schedules, Settings,
} from '@/src/features';
import { useAppDispatch, useAppSelector } from '@/src/utils/hooks';
import { classNames } from '@/src/utils/styles';
import { Listbox, Menu } from '@headlessui/react';
import { Term, semesterToTerm, termToSemester } from '@/src/lib';
import { useCallback, useState } from 'react';
import {
  FaChevronDown,
  FaCog, FaEdit, FaEyeSlash, FaGlobe,
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
import { ClearScheduleButton } from './ClearScheduleButton';

export default function HeaderSection({ s }: { s: ScheduleIdOrSemester }) {
  const dispatch = useAppDispatch();
  const { schedule, semester } = useScheduleFromScheduleIdOrSemester(s);
  const semesterFormat = useAppSelector(Planner.selectSemesterFormat);
  const [editing, setEditing] = useState(false);

  return (
    <Menu as="div" className="relative flex flex-col items-center p-2">
      {({ open }) => (
        <>
          <div className="group/column relative">
            {(schedule && editing) ? (
              <EditNameForm
                title={schedule.title}
                setEditing={setEditing}
                handleSubmit={(title) => (title
                  ? dispatch(Schedules.renameSchedule({ scheduleId: schedule.id, title }))
                  : Promise.reject(new Error('Invalid title')))
                  .catch((err) => {
                    console.error('Error renaming schedule', err);
                    alert('Error renaming schedule');
                  })}
              />
            ) : (
              <TitleComponent
                scheduleId={schedule ? schedule.id : null}
                term={semesterToTerm(semester!)}
                setEditing={setEditing}
              />
            )}

            {schedule && (
              <div className={classNames(
                'absolute right-full top-1/2 -translate-y-1/2',
                'opacity-0 transition-opacity group-hover/column:opacity-100',
                'flex items-center justify-center',
              )}
              >
                <button
                  type="button"
                  className="interactive"
                  onClick={() => dispatch(Schedules.setPublic({ scheduleId: schedule.id, public: !schedule.public }))}
                  title={schedule.public ? 'Make private' : 'Make public'}
                >
                  {schedule.public ? (
                    <FaGlobe />
                  ) : (
                    <FaEyeSlash />
                  )}
                </button>
              </div>
            )}

            <div className={classNames(
              'absolute left-full top-1/2 -translate-y-1/2',
              'flex items-center justify-center',
              !open && 'opacity-0 transition-opacity group-hover/column:opacity-100',
            )}
            >
              <Menu.Button className="interactive focus:outline-none">
                <span className="sr-only">Settings</span>
                <FaCog />
              </Menu.Button>
            </div>
          </div>

          {/* items of the menu positioned absolutely */}
          <FadeTransition>
            <Menu.Items className="menu-dropdown absolute top-full z-10">
              {semesterFormat !== 'sample' && schedule && (
              <MenuButton onClick={() => { setEditing(true); }} Icon={FaEdit} title="Rename" />
              )}
              <HideScheduleButton s={s} />
              {semesterFormat !== 'sample' && schedule && (
              <>
                <DeleteScheduleButton scheduleId={schedule.id} />
                <DuplicateScheduleButton scheduleId={schedule.id} />
                <ClearScheduleButton scheduleId={schedule.id} />
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

/**
 * Part of the {@link SemesterColumnHeader} component.
 */
function TitleComponent({ scheduleId, term, setEditing }: TitleComponentProps) {
  const semesterFormat = useAppSelector(Planner.selectSemesterFormat);
  const schedules = useAppSelector(Schedules.selectSchedules);
  const { justCreated, chooseNewSchedule } = useTitle(term, setEditing);
  const termSchedules = getSchedulesBySemester(schedules, termToSemester(term));

  const title = (scheduleId && schedules[scheduleId]?.title) ?? 'Loading...';

  // don't show the dropdown if all schedules are being shown
  if (semesterFormat === 'all') {
    return (
      <p className="text-center text-lg font-medium">
        {title}
      </p>
    );
  }

  return (
    <Listbox
      as="div"
      className="relative flex items-center"
      onChange={chooseNewSchedule}
    >
      {({ open }) => (
        <>
          <Link
            href={{
              pathname: '/schedule/[scheduleId]',
              query: { scheduleId },
            }}
            className="button text-center text-lg font-medium"
          >
            {title}
          </Link>

          <Listbox.Button className={classNames('round interactive select-none transition duration-500', open && 'rotate-180')}>
            <FaChevronDown />
          </Listbox.Button>

          <FadeTransition>
            <Listbox.Options className="menu-dropdown absolute left-1/2 top-full z-10 mt-2 w-max -translate-x-1/2 divide-y">
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
        </>
      )}
    </Listbox>
  );
}

function useTitle(
  term: Term,
  setEditing: (editing: boolean) => void,
) {
  const dispatch = useAppDispatch();
  const userId = Auth.useAuthProperty('uid');
  const [justCreated, setJustCreated] = useState<string | null>(null);

  const chooseNewSchedule = useCallback(async (id: string | null) => {
    if (id !== null) {
      await dispatch(Settings.chooseSchedule({
        term,
        scheduleId: id,
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
  }, [dispatch, setEditing, term, userId]);

  return {
    justCreated,
    chooseNewSchedule,
  };
}
