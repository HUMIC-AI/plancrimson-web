import React, {
  createContext, PropsWithChildren, useCallback, useContext,
} from 'react';
import { useRouter } from 'next/router';
import { useSchedule } from '../utils/schedules';
import { useAppSelector } from '../utils/hooks';
import { Schedules } from '../features';
import { GRAPH_SCHEDULE } from '../features/schedules';

export const ScheduleIdContext = createContext<string | null>(null);

export function ScheduleIdProvider({ id, children }: PropsWithChildren<{ id: string | null }>) {
  return (
    <ScheduleIdContext.Provider value={id}>
      {children}
    </ScheduleIdContext.Provider>
  );
}

export function useChosenSchedule() {
  const id = useContext(ScheduleIdContext)!;
  const graphSchedule = useAppSelector(Schedules.selectSchedule(GRAPH_SCHEDULE));
  const { schedule, error } = useSchedule(id === GRAPH_SCHEDULE ? null : id);
  return {
    id,
    schedule: id === GRAPH_SCHEDULE ? graphSchedule : schedule,
    error,
  };
}

export function useChooseSchedule() {
  const router = useRouter();

  const chooseSchedule = useCallback((id: string | null) => {
    const { selected, ...query } = router.query;
    router.replace({
      pathname: router.pathname,
      query: id ? { ...query, selected: id } : query,
    }, undefined, { shallow: true });
  }, [router]);

  return chooseSchedule;
}
