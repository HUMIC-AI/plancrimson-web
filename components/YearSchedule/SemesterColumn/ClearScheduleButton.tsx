import { Schedules } from '@/src/features';
import { useAppDispatch, useAppSelector } from '@/src/utils/hooks';
import { FaBroom } from 'react-icons/fa';
import { MenuButton } from './MenuButton';

export function ClearScheduleButton({ scheduleId }: { scheduleId: string; }) {
  const dispatch = useAppDispatch();
  const schedule = useAppSelector(Schedules.selectSchedule(scheduleId))!;

  return (
    <MenuButton
      onClick={() => schedule && schedule.classes && confirm(`This will remove all courses from your schedule "${schedule.title}"!`) && dispatch(Schedules.removeCourses({
        scheduleId,
        courseIds: schedule.classes,
      })).catch((err) => {
        console.error('Error clearing schedule', err);
      })}
      Icon={FaBroom}
      title="Clear"
    />
  );
}


