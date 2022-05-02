import { useRouter } from 'next/router';
import React, {
  createContext, Dispatch, PropsWithChildren, useContext, useMemo,
} from 'react';
import { Schedule } from '../../shared/firestoreTypes';
import { useAppSelector } from '../app/hooks';
import { selectSchedules } from '../features/schedules';

interface ChosenScheduleContextType {
  selectedSchedule: Schedule | null;
  selectSchedule: Dispatch<Schedule | null>;
}

/**
 * Passes down a global chosen schedule for use with deeply nested Instantsearch components.
 */
export const ChosenScheduleContext = createContext<ChosenScheduleContextType>({
  selectSchedule: () => null,
  selectedSchedule: null,
});

export function SelectedScheduleProvider({ children }: PropsWithChildren<{}>) {
  const schedules = useAppSelector(selectSchedules);
  const { query, pathname, replace } = useRouter();
  const { selected } = query;

  const context = useMemo<ChosenScheduleContextType>(
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
    [selected, schedules, replace, pathname],
  );

  return (
    <ChosenScheduleContext.Provider value={context}>
      {children}
    </ChosenScheduleContext.Provider>
  );
}

const useChosenScheduleContext = () => useContext(ChosenScheduleContext);

export default useChosenScheduleContext;
