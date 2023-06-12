import {
  PropsWithChildren, createContext, useContext, useMemo, useState,
} from 'react';
import { throwMissingContext } from '../utils/utils';

const CARD_STYLES = ['text', 'collapsed', 'expanded'] as const;

type CardStyle = typeof CARD_STYLES[number];

type ExpandCardsContextType = {
  expandCards: CardStyle;
  toggleExpand: () => void;
  setExpand: (style: CardStyle) => void;
};

const ExpandCardsContext = createContext<ExpandCardsContextType>({
  expandCards: 'expanded',
  toggleExpand: throwMissingContext,
  setExpand: throwMissingContext,
});

export default function ExpandCardsProvider({
  children, defaultStyle = 'expanded', sticky = false, readonly = false,
}: PropsWithChildren<{
  defaultStyle?: CardStyle;
  sticky?: boolean;
  readonly?: boolean;
}>) {
  const [expandCards, setExpandCards] = useState<CardStyle>(defaultStyle);

  const context = useMemo(() => ({
    expandCards,
    toggleExpand: () => {
      setExpandCards(CARD_STYLES[(CARD_STYLES.indexOf(expandCards) + 1) % CARD_STYLES.length]);
    },
    setExpand: (style: CardStyle) => {
      if (!readonly) {
        setExpandCards(style);
      }
    },
  }), [expandCards, readonly]);

  return (
    <ExpandCardsContext.Provider value={context}>
      {children}
    </ExpandCardsContext.Provider>
  );
}

export const useExpandCards = () => useContext(ExpandCardsContext);
