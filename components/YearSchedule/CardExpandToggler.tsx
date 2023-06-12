import React from 'react';
import { FaExpand, FaExpandAlt, FaExpandArrowsAlt } from 'react-icons/fa';
import { useExpandCards } from '@/src/context/expandCards';

export default function CardExpandToggler() {
  const { expandCards, toggleExpand } = useExpandCards();

  return (
    <button
      type="button"
      onClick={() => toggleExpand()}
      className="flex items-center justify-center text-blue-primary transition-opacity duration-200 hover:opacity-50"
    >
      {expandCards === 'text' && <FaExpand />}
      {expandCards === 'collapsed' && <FaExpandArrowsAlt />}
      {expandCards === 'expanded' && <FaExpandAlt />}
    </button>
  );
}
