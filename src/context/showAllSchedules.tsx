import React, {
  createContext, useContext, useMemo, useState,
} from 'react';
import { throwMissingContext } from '../../shared/util';
import { SampleSchedule } from '../requirements/util';

type ScheduleDisplay = 'all' | 'selected' | 'sample' | null;

type ShowAllSchedulesContextType = {
  showAllSchedules: ScheduleDisplay;
  setShowAllSchedules: React.Dispatch<React.SetStateAction<ScheduleDisplay>>;
  sampleSchedule: SampleSchedule | null;
  setSampleSchedule: React.Dispatch<
  React.SetStateAction<SampleSchedule | null>
  >;
};

export const ShowAllSchedulesContext = createContext<ShowAllSchedulesContextType>({
  showAllSchedules: null,
  setShowAllSchedules: throwMissingContext,
  sampleSchedule: null,
  setSampleSchedule: throwMissingContext,
});

export function SchedulesDisplayProvider({
  children,
}: React.PropsWithChildren<{}>) {
  const [schedulesDisplay, setSchedulesDisplay] = useState<ScheduleDisplay>('selected');
  const [sampleSchedule, setSampleSchedule] = useState<SampleSchedule | null>(
    null,
  );

  const context = useMemo(
    () => ({
      showAllSchedules: schedulesDisplay,
      setShowAllSchedules: setSchedulesDisplay,
      sampleSchedule,
      setSampleSchedule,
    }),
    [sampleSchedule, schedulesDisplay],
  );

  return (
    <ShowAllSchedulesContext.Provider value={context}>
      {children}
    </ShowAllSchedulesContext.Provider>
  );
}

const useShowAllSchedules = () => useContext(ShowAllSchedulesContext);

export default useShowAllSchedules;
