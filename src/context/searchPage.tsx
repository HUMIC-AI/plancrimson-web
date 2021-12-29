import React, {
  createContext, useContext, useMemo, useState,
} from 'react';
import { ScheduleSelectorProps } from '../../components/ScheduleSelector';
import useUserData from './userData';

type SearchPageContextType = ScheduleSelectorProps & {
  highlightEnabled: boolean;
  setHighlightEnabled: React.Dispatch<React.SetStateAction<boolean>>;
};

export const SearchPageContext = createContext<SearchPageContextType>({
  schedules: [],
  selectSchedule: () => null,
  selectedSchedule: null,
  highlightEnabled: true,
  setHighlightEnabled: () => null,
});

export const SearchPageContextProvider: React.FC = function ({ children }) {
  const { data } = useUserData();
  const [selectedSchedule, selectSchedule] = useState<string | null>(null);
  const [highlightEnabled, setHighlightEnabled] = useState(true);

  const context = useMemo<SearchPageContextType>(() => ({
    selectedSchedule,
    selectSchedule,
    schedules: Object.keys(data.schedules),
    highlightEnabled,
    setHighlightEnabled,
  }), [
    selectedSchedule, selectSchedule, data.schedules, highlightEnabled, setHighlightEnabled,
  ]);

  return (
    <SearchPageContext.Provider value={context}>
      {children}
    </SearchPageContext.Provider>
  );
};

const useSearchPageContext = () => useContext(SearchPageContext);

export default useSearchPageContext;
