import {
  PropsWithChildren, createContext, useContext, useMemo, useState,
} from 'react';
import { Explanation, GraphPhase } from '../../components/ExploreGraph/Graph';

const GraphContext = createContext<ReturnType<typeof useGraphState> | null>(null);

function useGraphState() {
  const [hoveredClassId, setHoveredClassId] = useState<string | null>(null);
  const [explanation, setExplanation] = useState<Explanation | null>(null);
  const [phase, setPhase] = useState<GraphPhase>('init');
  const [matchFilter, setMatchFilter] = useState<boolean>(true);

  const context = useMemo(() => ({
    hoveredClassId,
    setHoveredClassId,
    explanation,
    setExplanation,
    phase,
    setPhase,
    matchFilter,
    setMatchFilter,
  }), [hoveredClassId, explanation, phase, matchFilter]);

  return context;
}

export function GraphProvider({ children }: PropsWithChildren<{}>) {
  const context = useGraphState();

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
