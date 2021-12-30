import React, {
  createContext, useContext, useMemo, useState,
} from 'react';
import { ScheduleSelectorProps } from '../../components/ScheduleSelector';
import { Schedule } from '../../shared/firestoreTypes';
import useUserData from './userData';

export const SearchPageContext = createContext<ScheduleSelectorProps>({
  schedules: [],
  selectSchedule: () => null,
  selectedSchedule: null,
});

export const SearchPageContextProvider: React.FC = function ({ children }) {
  const { data } = useUserData();
  const [selectedSchedule, selectSchedule] = useState<Schedule | null>(null);

  const context = useMemo<ScheduleSelectorProps>(() => ({
    selectedSchedule,
    selectSchedule,
    schedules: Object.values(data.schedules),
  }), [
    selectedSchedule, selectSchedule, data.schedules,
  ]);

  return (
    <SearchPageContext.Provider value={context}>
      {children}
    </SearchPageContext.Provider>
  );
};

const useSearchPageContext = () => useContext(SearchPageContext);

export default useSearchPageContext;
