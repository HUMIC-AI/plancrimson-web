import React from 'react';
import { Planner } from '@/src/features';
import { useAppDispatch, useAppSelector } from '@/src/utils/hooks';
import { FaExpand, FaExpandAlt, FaExpandArrowsAlt } from 'react-icons/fa';

export default function CardExpandToggler() {
  const dispatch = useAppDispatch();
  const cardExpandStyle = useAppSelector(Planner.selectExpandCards);

  return (
    <button
      type="button"
      onClick={() => dispatch(Planner.toggleExpand())}
      className="flex items-center justify-center transition-opacity duration-200 hover:opacity-50"
    >
      {cardExpandStyle === 'text' && <FaExpand />}
      {cardExpandStyle === 'collapsed' && <FaExpandArrowsAlt />}
      {cardExpandStyle === 'expanded' && <FaExpandAlt />}
    </button>
  );
}
