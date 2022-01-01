import React, {
  createContext, useContext, useMemo, useState,
} from 'react';
import { throwMissingContext } from '../../shared/util';

type CardStyleContextType = {
  isExpanded: boolean;
  expand: React.Dispatch<React.SetStateAction<boolean>>;
};

const CardStyleContext = createContext<CardStyleContextType>({
  isExpanded: true,
  expand: throwMissingContext,
});

export const CardStyleProvider: React.FC = function ({ children }) {
  const [isExpanded, expand] = useState(true);

  const context = useMemo(() => ({
    isExpanded,
    expand,
  }), [isExpanded, expand]);

  return (
    <CardStyleContext.Provider value={context}>
      {children}
    </CardStyleContext.Provider>
  );
};

const useCardStyle = () => useContext(CardStyleContext);

export default useCardStyle;
