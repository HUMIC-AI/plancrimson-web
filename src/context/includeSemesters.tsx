import {
  PropsWithChildren, createContext, useContext, useMemo, useState,
} from 'react';
import { Term, getCurrentSemester, semesterToTerm } from '../lib';
import { throwMissingContext } from '../utils/utils';

type IncludeSemestersContextType = {
  includeSemesters: Term[];
  profilesOnly: boolean;
  setIncludeSemesters: (terms: Term[]) => void;
};

export const IncludeSemestersContext = createContext<IncludeSemestersContextType>({
  includeSemesters: [],
  profilesOnly: false,
  setIncludeSemesters: throwMissingContext,
});

export default function IncludeSemestersProvider({ children }: PropsWithChildren<{}>) {
  const [includedSemesters, setIncludedSemesters] = useState<Term[]>([
    semesterToTerm(getCurrentSemester()),
  ]);

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

export const useIncludeSemesters = () => useContext(IncludeSemestersContext);
