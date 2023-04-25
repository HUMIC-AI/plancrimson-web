import {
  Auth, Planner, Schedules, Settings,
} from '@/src/features';
import { selectSchedules } from '@/src/features/schedules';
import { useAppDispatch, useAppSelector } from '@/src/utils/hooks';
import { classNames } from '@/src/utils/styles';
import { Listbox, Menu } from '@headlessui/react';
import { Term, termToSemester } from '@/src/lib';
import { useCallback, useState } from 'react';
import { FaCalendar, FaCog, FaEdit } from 'react-icons/fa';
import FadeTransition from '@/components/Utils/FadeTransition';
import { getSchedulesBySemester } from '@/src/utils/schedules';
import { DeleteScheduleButton } from './DeleteScheduleButton';
import { DuplicateScheduleButton } from './DuplicateScheduleButton';
import { MenuButton } from './MenuButton';
import { EditNameForm } from './EditNameForm';
import { HideScheduleButton } from './HideScheduleButton';
import { PublishScheduleButton } from './PublishScheduleButton';

type HeaderProps = {
  semester: Term;
};

export default function HeaderSection({
  semester,
}: HeaderProps) {
  const dispatch = useAppDispatch();
  const chosenSchedules = useAppSelector(Settings.selectChosenSchedules);
  const chosenScheduleId = chosenSchedules[semester] ?? null;
  const semesterFormat = useAppSelector(Planner.selectSemesterFormat);
  const schedules = useAppSelector(selectSchedules);
  const schedule = chosenScheduleId ? schedules[chosenScheduleId] : null;
  const [editing, setEditing] = useState(false);

  return (
    <Menu as="div" className="relative flex flex-col items-center px-2">
      {({ open }) => (
        <>
          <div className="group relative mx-4 p-2">
            {(schedule && editing) ? (
              <EditNameForm
                title={schedule.title}
                setEditing={setEditing}
                handleSubmit={(title) => (title
                  ? dispatch(Schedules.renameSchedule({ scheduleId: schedule.id, title }))
                  : Promise.reject(new Error('Invalid title')))}
              />
            ) : (
              <TitleComponent term={semester} scheduleId={chosenScheduleId} />
            )}

            <Menu.Button className={classNames(
              'absolute left-full top-1/2 -translate-y-1/2 transition',
              !open && 'opacity-0 group-hover:opacity-100 hover:text-accent',
            )}
            >
              <FaCog />
            </Menu.Button>

          </div>

          <FadeTransition>
            <Menu.Items className="menu-dropdown absolute top-full z-10">
              {schedule && <MenuButton href={`/schedule/${schedule.id}`} Icon={FaCalendar} title="Calendar" />}
              {schedule && semesterFormat !== 'sample' && (
              <MenuButton onClick={() => { setEditing(true); }} Icon={FaEdit} title="Rename" />
              )}
              {semesterFormat === 'all' ? (
                schedule && <HideScheduleButton scheduleId={schedule.id} />
              ) : <HideScheduleButton term={semester} />}
              {semesterFormat !== 'sample' && schedule && (
              <>
                <DeleteScheduleButton scheduleId={schedule.id} />
                <DuplicateScheduleButton scheduleId={schedule.id} />
                <PublishScheduleButton scheduleId={schedule.id} />
              </>
              )}
            </Menu.Items>
          </FadeTransition>
        </>
      )}
    </Menu>
  );
}


type Props = {
  scheduleId: string | null; term: Term;
};

function TitleComponent({ scheduleId, term }: Props) {
  const dispatch = useAppDispatch();
  const userId = Auth.useAuthProperty('uid');
  const schedules = useAppSelector(selectSchedules);
  const schedule = scheduleId ? schedules[scheduleId] : null;

  const termSchedules = getSchedulesBySemester(schedules, termToSemester(term));

  const chooseNewSchedule = useCallback(async (scheduleId: string | null) => {
    let newScheduleId = scheduleId;
    if (scheduleId === null) {
      try {
        if (!userId) throw new Error('User is not logged in');
        const newSchedule = await dispatch(Schedules.createDefaultSchedule(termToSemester(term), userId));
        newScheduleId = newSchedule.payload.id;
      } catch (err) {
        console.error(err);
        alert("Couldn't create a new schedule! Please try again later.");
        return;
      }
    }

    await dispatch(Settings.chooseSchedule({
      term,
      scheduleId: newScheduleId,
    }));
  }, [term, userId]);

  return (
    <Listbox
      as="div"
      className="relative flex flex-col items-center"
      onChange={chooseNewSchedule}
    >
      <Listbox.Button className="select-none rounded px-2 text-center text-lg font-medium transition-colors hover:bg-gray-light">
        {schedule ? schedule.title : 'None'}
      </Listbox.Button>
      <FadeTransition>
        <Listbox.Options className="menu-dropdown absolute inset-x-0 top-full z-10 mt-2">
          {termSchedules.map((schedule) => (
            <Listbox.Option key={schedule.id} value={schedule.id} className="menu-button select-none">
              {schedule.title}
            </Listbox.Option>
          ))}
          <Listbox.Option value={null} className="menu-button select-none">
            Create new
          </Listbox.Option>
        </Listbox.Options>
      </FadeTransition>
    </Listbox>
  );
}

