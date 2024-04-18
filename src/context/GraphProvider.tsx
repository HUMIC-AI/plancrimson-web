import {
  Dispatch,
  PropsWithChildren, SetStateAction, createContext, useContext, useMemo, useState,
} from 'react';
import { Explanation } from '../../components/ExploreGraph/Graph';

const GraphContext = createContext<{
  hoveredClassId: string | null;
  setHoveredClassId: Dispatch<SetStateAction<string | null>>;
  explanation: Explanation | null;
  setExplanation: Dispatch<SetStateAction<Explanation | null>>;
} | null>(null);

export function GraphProvider({ children }: PropsWithChildren<{}>) {
  const [hoveredClassId, setHoveredClassId] = useState<string | null>(null);
  const [explanation, setExplanation] = useState<Explanation | null>(null);

  const context = useMemo(() => ({
    hoveredClassId,
    setHoveredClassId,
    explanation,
    setExplanation,
  }), [hoveredClassId, explanation]);

  return (
    <GraphContext.Provider value={context}>
      {children}
    </GraphContext.Provider>
  );
}

export function useGraphContext() {
  const context = useContext(GraphContext);
  if (!context) {
    throw new Error('useGraphContext must be used within a GraphProvider');
  }
  return context;
}