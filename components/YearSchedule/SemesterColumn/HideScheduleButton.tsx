import { Planner, Schedules } from '@/src/features';
import { useAppDispatch, useAppSelector } from '@/src/utils/hooks';
import { FaEyeSlash } from 'react-icons/fa';
import { MenuButton } from './MenuButton';

export function HideScheduleButton({ scheduleId }: { scheduleId: string | null; }) {
  const dispatch = useAppDispatch();
  const schedule = useAppSelector(Schedules.selectSchedule(scheduleId))!;
  const semesterFormat = useAppSelector(Planner.selectSemesterFormat);

  return (
    <MenuButton
      onClick={() => {
        if (semesterFormat === 'selected') {
          dispatch(Planner.setHiddenTerm({ term: `${schedule.year}${schedule.season}`, hidden: true }));
        } else if (scheduleId) {
          dispatch(Planner.setHiddenId({ id: scheduleId, hidden: true }));
        }
      }}
      Icon={FaEyeSlash}
      title="Hide"
    />
  );
}
