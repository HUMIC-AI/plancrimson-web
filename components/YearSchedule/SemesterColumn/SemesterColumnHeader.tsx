import { Planner, Schedules, Settings } from '@/src/features';
import { selectSchedules } from '@/src/features/schedules';
import { useAppDispatch, useAppSelector } from '@/src/utils/hooks';
import { classNames } from '@/src/utils/styles';
import { Menu } from '@headlessui/react';
import type { Term } from 'plancrimson-utils';
import { useState } from 'react';
import { FaCalendar, FaCog, FaEdit } from 'react-icons/fa';
import FadeTransition from '@/components/Utils/FadeTransition';
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

  if (!schedule) return null; // TODO

  return (
    <Menu as="div" className="relative flex flex-col items-center px-2">
      {({ open }) => (
        <>
          <div className="relative mx-4 p-2">
            {editing ? (
              <EditNameForm
                title={schedule.title}
                setEditing={setEditing}
                handleSubmit={(title) => (title
                  ? dispatch(Schedules.renameSchedule({ scheduleId: chosenScheduleId!, title }))
                  : Promise.reject(new Error('Invalid title')))}
              />
            ) : (
              <h3 className="text-center">
                {schedule.title}
              </h3>
            )}
            <Menu.Button className={classNames(
              'absolute left-full top-1/2 -translate-y-1/2 transition-opacity',
              open ? false : 'opacity-0 group-hover:opacity-100',
            )}
            >
              <FaCog />
            </Menu.Button>
          </div>
          <FadeTransition>
            <Menu.Items className="absolute top-full z-10 rounded bg-white p-1 text-gray-dark">
              <MenuButton href={`/schedule/${chosenScheduleId}`} Icon={FaCalendar} title="Calendar" />
              {semesterFormat !== 'sample' && (
              <MenuButton onClick={() => { setEditing(true); }} Icon={FaEdit} title="Rename" />
              )}
              <HideScheduleButton scheduleId={chosenScheduleId} />
              {semesterFormat !== 'sample' && chosenScheduleId && (
              <>
                <DeleteScheduleButton scheduleId={chosenScheduleId} />
                <DuplicateScheduleButton scheduleId={chosenScheduleId} />
                <PublishScheduleButton scheduleId={chosenScheduleId} />
              </>
              )}
            </Menu.Items>
          </FadeTransition>
        </>
      )}
    </Menu>
  );
}


