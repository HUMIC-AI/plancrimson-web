import {
  PropsWithChildren, createContext, useMemo, useState,
} from 'react';
import { getAnalytics, logEvent } from 'firebase/analytics';
import { useAssertContext } from '../utils/utils';
import { ExtendedClass } from '../lib';

const CARD_STYLES = ['text', 'collapsed', 'expanded'] as const;

type CardStyle = typeof CARD_STYLES[number];

type ProviderProps = {
  defaultStyle?: CardStyle;
  readonly?: boolean;
  confirmRemoval?: boolean;
  disableClick?: boolean;
  hover?: {
    onHover: (course: ExtendedClass) => void;
    filter: (course: ExtendedClass) => boolean;
  };
  clickWholeCard?: boolean;
  columns: number;
};

function useCourseCardStyleContext({
  defaultStyle = 'expanded',
  readonly = false,
  clickWholeCard = false,
  disableClick = false,
  columns,
  hover,
  confirmRemoval = false,
}: ProviderProps) {
  const [style, setCourseCardStyle] = useState<CardStyle>(defaultStyle);

  const context = useMemo(() => ({
    style,
    clickWholeCard,
    columns,
    confirmRemoval,
    disableClick,
    hover,
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
  }), [style, clickWholeCard, columns, confirmRemoval, disableClick, hover, readonly]);

  return context;
}

type CourseCardStyleContextType = ReturnType<typeof useCourseCardStyleContext>;

const CourseCardStyleContext = createContext<CourseCardStyleContextType | null>(null);

export default function CourseCardStyleProvider({ children, ...props }: PropsWithChildren<ProviderProps>) {
  const context: CourseCardStyleContextType = useCourseCardStyleContext(props);

  return (
    <CourseCardStyleContext.Provider value={context}>
      {children}
    </CourseCardStyleContext.Provider>
  );
}

export const useCourseCardStyle = () => useAssertContext(CourseCardStyleContext);
