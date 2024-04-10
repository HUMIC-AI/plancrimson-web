import {
  Auth, Planner, Schedules, Settings,
} from '@/src/features';
import { useAppDispatch, useAppSelector } from '@/src/utils/hooks';
import { classNames } from '@/src/utils/styles';
import { Menu } from '@headlessui/react';
import { Term, semesterToTerm, termToSemester } from '@/src/lib';
import { useCallback, useState } from 'react';
import {
  FaCog, FaEdit, FaEyeSlash, FaGlobe,
} from 'react-icons/fa';
import FadeTransition from '@/components/Utils/FadeTransition';
import { ScheduleIdOrSemester } from '@/src/types';
import { DeleteScheduleButton } from './DeleteScheduleButton';
import { DuplicateScheduleButton } from './DuplicateScheduleButton';
import { MenuButton } from './MenuButton';
import { EditNameForm } from './EditNameForm';
import { HideScheduleButton } from './HideScheduleButton';
import { useScheduleFromScheduleIdOrSemester } from './useScheduleFromScheduleIdOrSemester';
import { ClearScheduleButton } from './ClearScheduleButton';
import { TitleComponent } from './TitleComponent';
import { getSchedulesBySemester } from '../../../src/utils/schedules';

export default function HeaderSection({ s }: { s: ScheduleIdOrSemester }) {
  const dispatch = useAppDispatch();
  const { schedule, semester } = useScheduleFromScheduleIdOrSemester(s);
  const semesterFormat = useAppSelector(Planner.selectSemesterFormat);
  const [editing, setEditing] = useState(false);
  const term = semester && semesterToTerm(semester);
  const { justCreated, chooseSchedule } = useChooseSchedule(term, setEditing);
  const schedules = useAppSelector(Schedules.selectSchedules);
  const idList = semester
    ? getSchedulesBySemester(schedules, semester)
      .map((g) => (g.id !== justCreated ? g.id : null!))
      .filter(Boolean)
    : [];

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
                chooseSchedule={chooseSchedule}
                idList={idList}
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


function useChooseSchedule(
  term: Term | null,
  setEditing: (editing: boolean) => void,
) {
  const dispatch = useAppDispatch();
  const userId = Auth.useAuthProperty('uid');
  const [justCreated, setJustCreated] = useState<string | null>(null);

  const chooseSchedule = useCallback(async (id: string | null) => {
    if (!term) {
      console.error('No term provided to chooseSchedule');
      return;
    }

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
    chooseSchedule,
  };
}
