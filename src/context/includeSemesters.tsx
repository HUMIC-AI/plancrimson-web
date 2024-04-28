import {
  PropsWithChildren, createContext, useMemo, useState,
} from 'react';
import { Term } from '../lib';
import { useAssertContext } from '../utils/utils';

type IncludeSemestersContextType = {
  includeSemesters: Term[];
  profilesOnly: boolean;
  setIncludeSemesters: (terms: Term[]) => void;
};

export const IncludeSemestersContext = createContext<IncludeSemestersContextType | null>(null);

export default function IncludeSemestersProvider({ children }: PropsWithChildren<{}>) {
  const [includedSemesters, setIncludedSemesters] = useState<Term[]>([]);

  const context = useMemo(() => ({
    includeSemesters: includedSemesters,
    profilesOnly: includedSemesters.length === 0,
    setIncludeSemesters: setIncludedSemesters,
  }), [includedSemesters]);

  return (
    <IncludeSemestersContext.Provider value={context}>
      {children}
    </IncludeSemestersContext.Provider>
  );
}

export const useIncludeSemesters = () => useAssertContext(IncludeSemestersContext);
