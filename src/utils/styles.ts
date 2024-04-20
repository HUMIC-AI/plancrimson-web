import { useState, useEffect } from 'react';
import { Subject, getSubjectHue } from '../lib';

// See the defaults from https://tailwindcss.com/docs/screens
export const breakpoints = {
  sm: 640,
  md: 768,
  lg: 1024,
};

export function classNames(...classes: (string | boolean | null | undefined)[]) {
  return classes.filter(Boolean).join(' ');
}


/**
 * @returns if the screen is past a breakpoint.
 */
export function useBreakpoint(breakpoint: number) {
  const [isPast, setIsPast] = useState(false);

  useEffect(() => {
    if (!window) return; // ignore on server side

    function handleResize(this: Window) {
      setIsPast(this.innerWidth >= breakpoint);
    }

    setIsPast(window.innerWidth >= breakpoint);

    window.addEventListener('resize', handleResize);

    return () => window.removeEventListener('resize', handleResize);
  }, [breakpoint]);

  return isPast;
}

export function getSubjectColor(subject: Subject, lightness?: string) {
  const h = getSubjectHue(subject);
  return `hsla(${h}, 70%, ${lightness ?? 'var(--subject-color-lightness)'}, 0.95)`;
}
