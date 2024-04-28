import React, {
  createContext, PropsWithChildren, useCallback, useMemo,
} from 'react';
import { useRouter } from 'next/router';
import { useSchedule } from '../utils/schedules';
import { BaseSchedule } from '../types';
import { useAssertContext } from '../utils/utils';

export type ScheduleContextType = {
  id: string | null;
  schedule: BaseSchedule | null;
  error: unknown;
};

export const ScheduleContext = createContext<Readonly<ScheduleContextType> | null>(null);

export function ScheduleProvider({ id, children }: PropsWithChildren<{ id: string | null }>) {
  // need to handle graph schedule separately since it is not uploaded
  const { schedule, error } = useSchedule(id);
  const context = useMemo<ScheduleContextType>(() => ({
    id,
    schedule,
    error,
  }), [id, schedule, error]);

  return (
    <ScheduleContext.Provider value={context}>
      {children}
    </ScheduleContext.Provider>
  );
}

/**
 * Listen for the chosen schedule or just read from the graph schedule.
 */
export const useChosenSchedule = () => useAssertContext(ScheduleContext);

/**
 * Replaces the chosen schedule in the URL.
 */
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
