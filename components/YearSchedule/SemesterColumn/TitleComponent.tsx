import { Listbox } from '@headlessui/react';
import Link from 'next/link';
import { FaChevronDown } from 'react-icons/fa';
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
};

/**
 * Part of the {@link SemesterColumnHeader} component.
 */
export function TitleComponent({ scheduleId, idList, chooseSchedule }: TitleComponentProps) {
  const semesterFormat = useAppSelector(Planner.selectSemesterFormat);
  const schedules = useAppSelector(Schedules.selectSchedules);
  const termSchedules = useMemo(() => idList.map((id) => schedules[id]), [idList, schedules]);
  const title = (scheduleId && schedules[scheduleId]?.title) ?? 'Loading...';

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
      className="relative flex items-center"
      value={scheduleId}
      onChange={chooseSchedule}
    >
      {({ open }) => (
        <>
          <TitleLink scheduleId={scheduleId}>
            {title}
          </TitleLink>

          <Listbox.Button className={classNames('round interactive select-none transition duration-500', open && 'rotate-180')}>
            <FaChevronDown />
          </Listbox.Button>

          <FadeTransition>
            <Listbox.Options className="menu-dropdown absolute left-1/2 top-full z-10 mt-2 w-max -translate-x-1/2 divide-y">
              {termSchedules.map((schedule) => (
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

function TitleLink({
  children,
  scheduleId,
}: PropsWithChildren<{
  scheduleId: ScheduleId | null;
}>) {
  if (!scheduleId) {
    return (
      <p className="text-center text-lg font-medium">
        {children}
      </p>
    );
  }

  return (
    <Link
      href={{
        pathname: '/schedule/[scheduleId]',
        query: { scheduleId },
      }}
      className="button text-center text-lg font-medium"
    >
      {children}
    </Link>
  );
}
