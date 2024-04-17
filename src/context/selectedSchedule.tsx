import React, {
  createContext, PropsWithChildren, useCallback, useContext,
} from 'react';
import { useRouter } from 'next/router';
import { useSchedule } from '../utils/schedules';

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
  const { schedule, error } = useSchedule(id);
  return {
    id,
    schedule,
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
