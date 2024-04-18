import React from 'react';
import { FaExpand, FaExpandAlt, FaExpandArrowsAlt } from 'react-icons/fa';
import { useCourseCardStyle } from '@/src/context/CourseCardStyleProvider';

export default function CardExpandToggler() {
  const { style, toggleStyle } = useCourseCardStyle();

  return (
    <button
      type="button"
      onClick={toggleStyle}
      className="interactive secondary-gray flex items-center justify-center rounded-full p-1"
    >
      {style === 'text' && <FaExpand />}
      {style === 'collapsed' && <FaExpandArrowsAlt />}
      {style === 'expanded' && <FaExpandAlt />}
    </button>
  );
}
