import { Schedules } from '@/src/features';
import { useAppDispatch, useAppSelector } from '@/src/utils/hooks';
import { FaLink, FaLock } from 'react-icons/fa';
import { MenuButton } from './MenuButton';

export function PublishScheduleButton({ scheduleId }: { scheduleId: string; }) {
  const dispatch = useAppDispatch();
  const schedule = useAppSelector(Schedules.selectSchedule(scheduleId))!;

  return (
    <MenuButton
      onClick={() => dispatch(Schedules.setPublic({ scheduleId, public: !schedule.public }))}
      Icon={schedule.public ? FaLock : FaLink}
      title={schedule.public ? 'Make private' : 'Make public'}
    />
  );
}
