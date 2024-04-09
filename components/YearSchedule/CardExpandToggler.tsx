import React from 'react';
import { FaExpand, FaExpandAlt, FaExpandArrowsAlt } from 'react-icons/fa';
import { useExpandCards } from '@/src/context/expandCards';

export default function CardExpandToggler() {
  const { expandCards, toggleExpand } = useExpandCards();

  return (
    <button
      type="button"
      onClick={() => toggleExpand()}
      className="interactive secondary-gray flex items-center justify-center rounded-full p-1"
    >
      {expandCards === 'text' && <FaExpand />}
      {expandCards === 'collapsed' && <FaExpandArrowsAlt />}
      {expandCards === 'expanded' && <FaExpandAlt />}
    </button>
  );
}
