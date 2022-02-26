import { useRouter } from 'next/router';
import React, {
  createContext, Dispatch, PropsWithChildren, useContext, useMemo,
} from 'react';
import { Schedule } from '../../shared/firestoreTypes';
import { useAppSelector } from '../app/hooks';
import { selectSchedules } from '../features/schedules';

interface SelectedScheduleContextType {
  selectedSchedule: Schedule | null;
  selectSchedule: Dispatch<Schedule | null>;
}

export const SelectedScheduleContext = createContext<SelectedScheduleContextType>({
  selectSchedule: () => null,
  selectedSchedule: null,
});

export function SelectedScheduleProvider({ children }: PropsWithChildren<{}>) {
  const schedules = useAppSelector(selectSchedules);
  const { query, pathname, replace } = useRouter();
  const { selected } = query;

  const context = useMemo<SelectedScheduleContextType>(
    () => ({
      selectedSchedule:
        (typeof selected === 'string' && schedules[selected]) || null,
      // see https://nextjs.org/docs/api-reference/next/link#with-url-object
      selectSchedule(schedule) {
        if (schedule) {
          replace({ pathname, query: { selected: schedule.id } });
        } else {
          replace(pathname);
        }
      },
    }),
    [selected, schedules, pathname],
  );

  return (
    <SelectedScheduleContext.Provider value={context}>
      {children}
    </SelectedScheduleContext.Provider>
  );
}

const useSelectedScheduleContext = () => useContext(SelectedScheduleContext);

export default useSelectedScheduleContext;
