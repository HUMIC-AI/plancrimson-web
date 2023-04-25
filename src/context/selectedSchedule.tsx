import { useRouter } from 'next/router';
import React, {
  createContext, Dispatch, PropsWithChildren, useContext, useMemo,
} from 'react';

interface ChosenScheduleContextType {
  chosenScheduleId: string | null;
  chooseSchedule: Dispatch<string | null>;
}

/**
 * Passes down a global chosen schedule for use with deeply nested Instantsearch components.
 */
export const ChosenScheduleContext = createContext<ChosenScheduleContextType>({
  chooseSchedule: () => null,
  chosenScheduleId: null,
});

export function ChosenScheduleProvider({ children }: PropsWithChildren<{}>) {
  const { query, pathname, replace } = useRouter();
  const { selected: chosenScheduleId } = query;

  const context = useMemo<ChosenScheduleContextType>(
    () => ({
      chosenScheduleId: typeof chosenScheduleId === 'string' ? chosenScheduleId : null,
      // see https://nextjs.org/docs/api-reference/next/link#with-url-object
      chooseSchedule(scheduleId) {
        if (scheduleId) {
          replace({ pathname, query: { selected: scheduleId } });
        } else {
          replace(pathname);
        }
      },
    }),
    [chosenScheduleId, replace, pathname],
  );

  return (
    <ChosenScheduleContext.Provider value={context}>
      {children}
    </ChosenScheduleContext.Provider>
  );
}

const useChosenScheduleContext = () => useContext(ChosenScheduleContext);

export default useChosenScheduleContext;
