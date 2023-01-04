import React from 'react';
import { classNames } from '../../shared/util';
import { Planner } from '../../src/features';
import { useAppDispatch, useAppSelector } from '../../src/hooks';

export default function CardExpandToggler() {
  const dispatch = useAppDispatch();
  const cardExpandStyle = useAppSelector(Planner.selectExpandCards);

  return (
    <button
      type="button"
      onClick={() => dispatch(Planner.toggleExpand())}
      className={classNames(
        'bg-white text-gray-800 rounded-full hover:opacity-50 px-2 border flex items-center',
      )}
    >
      {cardExpandStyle === 'text' && 'Text'}
      {cardExpandStyle === 'collapsed' && 'Collapsed'}
      {cardExpandStyle === 'expanded' && 'Expanded'}
    </button>
  );
}
