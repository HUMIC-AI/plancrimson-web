import { Schedules, Settings } from '@/src/features';
import { useAppDispatch, useAppSelector } from '@/src/utils/hooks';
import { useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { FaClone } from 'react-icons/fa';
import { MenuButton } from './MenuButton';

export function DuplicateScheduleButton({ scheduleId }: { scheduleId: string; }) {
  const dispatch = useAppDispatch();
  const schedule = useAppSelector(Schedules.selectSchedule(scheduleId))!;

  const handleDuplicate = useCallback(async () => {
    try {
      const newSchedule = await dispatch(Schedules.createSchedule({
        ...schedule, id: uuidv4(), title: `${schedule.title} copy`,
      }));
      await dispatch(Settings.chooseSchedule({
        term: `${schedule.year}${schedule.season}`,
        scheduleId: newSchedule.payload.id,
      }));
    } catch (err) {
      console.error('error duplicating schedule:', err);
      alert("Couldn't duplicate your schedule. Please try again later.");
    }
  }, [dispatch, schedule]);

  return <MenuButton onClick={handleDuplicate} Icon={FaClone} title="Duplicate" />;
}
