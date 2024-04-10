import React from 'react';
import { FaChevronDown, FaChevronUp } from 'react-icons/fa';
import CardExpandToggler from '@/components/YearSchedule/CardExpandToggler';
import { classNames } from '@/src/utils/styles';

export interface ButtonProps {
  onClick: () => void;
  enabled: boolean;
  direction: 'up' | 'down';
}

export function MoreHitsButton({
  onClick, enabled, direction,
}: ButtonProps) {
  return (
    <div className="relative">
      <button
        type="button"
        onClick={onClick}
        disabled={!enabled}
        className={classNames(
          enabled
            ? 'hover:opacity-50'
            : 'cursor-not-allowed',
          'p-2 bg-gray-secondary shadow w-24 sm:w-48 rounded transition-opacity',
          'flex justify-center',
        )}
      >
        {direction === 'up' && <FaChevronUp />}
        {direction === 'down' && <FaChevronDown />}
      </button>
      <div className="absolute left-full top-1/2 ml-2 -translate-y-1/2">
        <CardExpandToggler />
      </div>
    </div>
  );
}
