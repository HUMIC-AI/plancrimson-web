import {
  PropsWithChildren, createContext, useContext, useMemo, useState,
} from 'react';
import { getAnalytics, logEvent } from 'firebase/analytics';
import { throwMissingContext } from '../utils/utils';

const CARD_STYLES = ['text', 'collapsed', 'expanded'] as const;

type CardStyle = typeof CARD_STYLES[number];

type CourseCardStyleContextType = {
  style: CardStyle;
  toggleStyle: () => void;
  setStyle: (style: CardStyle) => void;
};

const CourseCardStyleContext = createContext<CourseCardStyleContextType>({
  style: 'expanded',
  toggleStyle: throwMissingContext,
  setStyle: throwMissingContext,
});

export default function CourseCardStyleProvider({
  children, defaultStyle = 'expanded', readonly = false,
}: PropsWithChildren<{
  defaultStyle?: CardStyle;
  readonly?: boolean;
}>) {
  const [style, setCourseCardStyle] = useState<CardStyle>(defaultStyle);

  const context: CourseCardStyleContextType = useMemo(() => ({
    style,
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
  }), [style, readonly]);

  return (
    <CourseCardStyleContext.Provider value={context}>
      {children}
    </CourseCardStyleContext.Provider>
  );
}

export const useCourseCardStyle = () => useContext(CourseCardStyleContext);
