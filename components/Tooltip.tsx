import React from 'react';
import { classNames } from '../shared/util';

type Props = {
  text: string;
  direction: 'bottom' | 'left';
};

export default function Tooltip({
  text,
  children,
  direction,
}: React.PropsWithChildren<Props>) {
  return (
    <span className="group relative">
      {children}
      <span
        className={classNames(
          'absolute z-10',
          direction === 'left'
            && 'right-full mr-2 top-1/2 transform -translate-y-1/2 w-max',
          direction === 'bottom'
            && 'top-full mt-2 left-1/2 transform -translate-x-1/2 text-center',
          'hidden group-hover:block bg-white bg-opacity-80 border-2 shadow text-black',
          'max-w-[8rem] h-min p-2 rounded-md transition-opacity',
        )}
      >
        {text}
      </span>
    </span>
  );
}
