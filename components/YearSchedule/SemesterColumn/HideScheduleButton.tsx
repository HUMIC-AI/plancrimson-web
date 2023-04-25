import { Planner } from '@/src/features';
import { useAppDispatch } from '@/src/utils/hooks';
import { FaEyeSlash } from 'react-icons/fa';
import { isScheduleId } from '@/src/utils/schedules';
import { semesterToTerm } from '@/src/lib';
import type { ScheduleIdOrSemester } from '@/src/types';
import { MenuButton } from './MenuButton';

export function HideScheduleButton({ s } : { s: ScheduleIdOrSemester }) {
  const dispatch = useAppDispatch();

  return (
    <MenuButton
      onClick={() => {
        if (isScheduleId(s)) {
          dispatch(Planner.setHiddenId({ id: s, hidden: true }));
        } else {
          dispatch(Planner.setHiddenTerm({ term: semesterToTerm(s), hidden: true }));
        }
      }}
      Icon={FaEyeSlash}
      title="Hide"
    />
  );
}
