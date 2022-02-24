import { useRouter } from 'next/router';
import React, { createContext, useContext, useMemo } from 'react';
import { ScheduleSelectorProps } from '../../components/ScheduleSelector';
import { sortSchedules } from '../../shared/util';
import { useAppSelector } from '../app/hooks';
import { selectSchedules } from '../features/schedules';

type SelectedScheduleContextType = Omit<ScheduleSelectorProps, 'direction'>;

export const SelectedScheduleContext = createContext<SelectedScheduleContextType>({
  schedules: [],
  selectSchedule: () => null,
  selectedSchedule: null,
});

export const SelectedScheduleProvider: React.FC = function ({ children }) {
  const schedules = useAppSelector(selectSchedules);
  const { query, pathname, replace } = useRouter();
  const { selected } = query;

  const context = useMemo<SelectedScheduleContextType>(
    () => ({
      selectedSchedule:
        (typeof selected === 'string' && schedules[selected]) || null,
      // see https://nextjs.org/docs/api-reference/next/link#with-url-object
      selectSchedule: (schedule) => schedule && replace({ pathname, query: { selected: schedule.id } }),
      schedules: sortSchedules(schedules),
    }),
    [selected, schedules, pathname, replace],
  );

  return (
    <SelectedScheduleContext.Provider value={context}>
      {children}
    </SelectedScheduleContext.Provider>
  );
};

const useSelectedScheduleContext = () => useContext(SelectedScheduleContext);

export default useSelectedScheduleContext;
