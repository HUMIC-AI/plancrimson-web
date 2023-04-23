import { useState, useEffect } from 'react';

// See the defaults from https://tailwindcss.com/docs/screens
export const breakpoints = {
  sm: 640,
  md: 768,
  lg: 1024,
};

export function classNames(...classes: (string | boolean)[]) {
  return classes
    .filter(Boolean)
    .join(' ')
    .replace(
      'hover-blue',
      'shadow rounded bg-black hover:bg-opacity-50 text-white transition-colors',
    );
}


export function useBreakpoint(breakpoint: number) {
  const [isPast, setIsPast] = useState(false);

  useEffect(() => {
    if (!window) return; // ignore on server

    function handleResize(this: Window) {
      setIsPast(this.innerWidth >= breakpoint);
    }

    setIsPast(window.innerWidth >= breakpoint);

    window.addEventListener('resize', handleResize);

    // eslint-disable-next-line consistent-return
    return () => window.removeEventListener('resize', handleResize);
  }, [breakpoint]);

  return isPast;
}
