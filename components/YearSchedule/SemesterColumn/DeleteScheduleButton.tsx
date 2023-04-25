import { Schedules, Settings } from '@/src/features';
import { selectSchedules } from '@/src/features/schedules';
import { useAppDispatch, useAppSelector } from '@/src/utils/hooks';
import { useCallback } from 'react';
import { FaTrash } from 'react-icons/fa';
import { semesterToTerm } from '@/src/lib';
import { MenuButton } from './MenuButton';
import { getPreviousSchedule } from '@/src/utils/schedules';

export function DeleteScheduleButton({ scheduleId }: { scheduleId: string; }) {
  const dispatch = useAppDispatch();
  const schedules = useAppSelector(selectSchedules);
  const schedule = schedules[scheduleId];

  const deleteSchedule = useCallback(() => {
    const confirmDelete = confirm(
      `Are you sure you want to delete your schedule ${schedule.title}?`,
    );

    if (confirmDelete) {
      const previousSchedule = getPreviousSchedule(schedules, schedule.id);
      dispatch(Schedules.deleteSchedule(schedule.id))
        .then(() => dispatch(Settings.chooseSchedule({
          term: semesterToTerm(schedule),
          scheduleId: previousSchedule ? previousSchedule.id : null,
        })))
        .catch((err) => {
          console.error(err);
          alert(
            'There was a problem deleting your schedule. Please try again later.',
          );
        });
    }
  }, [dispatch, schedule, schedules]);

  return (
    <MenuButton onClick={deleteSchedule} Icon={FaTrash} title="Delete" />
  );
}
