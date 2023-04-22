import React from 'react';
import { Planner } from '@/src/features';
import { useAppDispatch } from '@/src/hooks';
import { FaExpandArrowsAlt } from 'react-icons/fa';

export default function CardExpandToggler() {
  const dispatch = useAppDispatch();

  return (
    <button
      type="button"
      onClick={() => dispatch(Planner.toggleExpand())}
      className="flex items-center justify-center transition-opacity duration-200 hover:opacity-50"
    >
      <FaExpandArrowsAlt />
    </button>
  );
}
