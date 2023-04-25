import { Planner } from '@/src/features';
import { useAppDispatch } from '@/src/utils/hooks';
import { FaEyeSlash } from 'react-icons/fa';
import { Term } from '@/src/lib';
import { MenuButton } from './MenuButton';

type Props = {
  term?: never;
  scheduleId: string;
} | {
  term: Term;
  scheduleId?: never;
};

export function HideScheduleButton({ scheduleId, term }: Props) {
  const dispatch = useAppDispatch();

  return (
    <MenuButton
      onClick={() => {
        if (term) {
          dispatch(Planner.setHiddenTerm({ term, hidden: true }));
        } else {
          dispatch(Planner.setHiddenId({ id: scheduleId, hidden: true }));
        }
      }}
      Icon={FaEyeSlash}
      title="Hide"
    />
  );
}
