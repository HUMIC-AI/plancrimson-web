import { useRouter } from 'next/router';
import React, {
  createContext, useContext, useMemo,
} from 'react';
import { ScheduleSelectorProps } from '../../components/ScheduleSelector';
import { sortSchedules } from '../../shared/util';
import useUserData from './userData';

export const SelectedScheduleContext = createContext<ScheduleSelectorProps>({
  schedules: [],
  selectSchedule: () => null,
  selectedSchedule: null,
});

export const SelectedScheduleProvider: React.FC = function ({ children }) {
  const { data: { schedules } } = useUserData();
  const { query, pathname, replace } = useRouter();
  const { selected } = query;

  const context = useMemo<ScheduleSelectorProps>(() => ({
    selectedSchedule: (typeof selected === 'string' && schedules[selected]) || null,
    // see https://nextjs.org/docs/api-reference/next/link#with-url-object
    selectSchedule: (schedule) => replace({ pathname, query: { selected: schedule.id } }),
    schedules: sortSchedules(schedules),
  }), [
    selected, schedules, pathname, replace,
  ]);

  return (
    <SelectedScheduleContext.Provider value={context}>
      {children}
    </SelectedScheduleContext.Provider>
  );
};

const useSelectedScheduleContext = () => useContext(SelectedScheduleContext);

export default useSelectedScheduleContext;
