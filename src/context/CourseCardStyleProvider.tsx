import {
  PropsWithChildren, createContext, useMemo, useState,
} from 'react';
import { getAnalytics, logEvent } from 'firebase/analytics';
import { useAssertContext } from '../utils/utils';

const CARD_STYLES = ['text', 'collapsed', 'expanded'] as const;

type CardStyle = typeof CARD_STYLES[number];

type CourseCardStyleContextType = {
  style: CardStyle;
  clickWholeCard: boolean;
  toggleStyle: () => void;
  setStyle: (style: CardStyle) => void;
};

const CourseCardStyleContext = createContext<CourseCardStyleContextType | null>(null);

export default function CourseCardStyleProvider({
  children, defaultStyle = 'expanded', readonly = false, clickWholeCard = false,
}: PropsWithChildren<{
  defaultStyle?: CardStyle;
  readonly?: boolean;
  clickWholeCard?: boolean;
}>) {
  const [style, setCourseCardStyle] = useState<CardStyle>(defaultStyle);

  const context: CourseCardStyleContextType = useMemo(() => ({
    style,
    clickWholeCard,
    toggleStyle: () => {
      const newStyle = CARD_STYLES[(CARD_STYLES.indexOf(style) + 1) % CARD_STYLES.length];
      logEvent(getAnalytics(), 'toggle_expand_cards', { oldStyle: style, newStyle });
      setCourseCardStyle(newStyle);
    },
    setStyle: (s: CardStyle) => {
      if (!readonly) {
        setCourseCardStyle(s);
      }
    },
  }), [style, clickWholeCard, readonly]);

  return (
    <CourseCardStyleContext.Provider value={context}>
      {children}
    </CourseCardStyleContext.Provider>
  );
}

export const useCourseCardStyle = () => useAssertContext(CourseCardStyleContext);
