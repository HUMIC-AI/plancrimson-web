import { Listbox, Menu } from '@headlessui/react';
import Link from 'next/link';
import { FaChevronDown, FaCog } from 'react-icons/fa';
import { PropsWithChildren, useMemo } from 'react';
import { Planner, Schedules } from '../../../src/features';
import { ScheduleId } from '../../../src/types';
import { useAppSelector } from '../../../src/utils/hooks';
import { classNames } from '../../../src/utils/styles';
import FadeTransition from '../../Utils/FadeTransition';

export type TitleComponentProps = {
  scheduleId: ScheduleId | null;
  idList: ScheduleId[];
  chooseSchedule: (scheduleId: ScheduleId | null) => void;
  showSettings?: boolean;
  showCreate?: boolean;
};

/**
 * Part of the {@link SemesterColumnHeader} component.
 */
export function TitleComponent({
  scheduleId, idList, chooseSchedule, showSettings = true, showCreate = true,
}: TitleComponentProps) {
  const semesterFormat = useAppSelector(Planner.selectSemesterFormat);
  const schedules = useAppSelector(Schedules.selectSchedules);
  const termSchedules = useMemo(() => idList.map((id) => schedules[id]), [idList, schedules]);
  const title = scheduleId ? schedules[scheduleId]?.title ?? 'Loading...' : 'Select a schedule';

  // don't show the dropdown if all schedules are being shown
  if (semesterFormat === 'all') {
    return (
      <TitleLink scheduleId={scheduleId}>
        {title}
      </TitleLink>
    );
  }

  return (
    <Listbox
      as="div"
      className="relative flex items-center space-x-1"
      value={scheduleId}
      onChange={chooseSchedule}
    >
      {({ open }) => (
        <>
          {showSettings && (
          <Menu.Button className="interactive focus:outline-none">
            <span className="sr-only">Settings</span>
            <FaCog />
          </Menu.Button>
          )}

          <TitleLink scheduleId={scheduleId}>
            {title}
          </TitleLink>

          <Listbox.Button className={classNames('interactive select-none duration-500', open && 'rotate-180')}>
            <FaChevronDown />
          </Listbox.Button>

          <FadeTransition>
            <Listbox.Options className="menu-dropdown absolute left-1/2 top-full z-10 mt-2 w-max -translate-x-1/2 divide-y">
              {termSchedules.map((schedule) => (
                <Listbox.Option
                  key={schedule.id}
                  value={schedule.id}
                  className={classNames(
                    'menu-button select-none first:rounded-t',
                    !showCreate && 'last:rounded-b',
                  )}
                >
                  {schedule.title}
                </Listbox.Option>
              ))}
              {showCreate && (
              <Listbox.Option value={null} className="menu-button select-none rounded-b">
                Create new
              </Listbox.Option>
              )}
            </Listbox.Options>
          </FadeTransition>
        </>
      )}
    </Listbox>
  );
}

function TitleLink({
  children,
  scheduleId,
}: PropsWithChildren<{
  scheduleId: ScheduleId | null;
}>) {
  return (
    <p className="interactive text-lg font-medium">
      {scheduleId
        ? (
          <Link
            href={{
              pathname: '/schedule/[scheduleId]',
              query: { scheduleId },
            }}
          >
            {children}
          </Link>
        ) : children}
    </p>
  );
}
