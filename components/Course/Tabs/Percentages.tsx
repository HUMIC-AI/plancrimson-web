import React from 'react';
import { classNames } from '@/src/utils/styles';

const colors = [
  'bg-percents-1',
  'bg-percents-2',
  'bg-percents-3',
  'bg-percents-4',
  'bg-percents-5',
];

type Props = { categories: number[] | null };

/**
 * A sequence of colored bars with widths proportional to their values
 * @param categories a list of numbers
 */
export default function Percentages({ categories: allCategories }: Props) {
  if (!allCategories) return <p>Unknown</p>;

  const total = allCategories.reduce((acc, val) => acc + val, 0);

  return (
    <div className="flex h-6 rounded text-base text-black shadow-md">
      {allCategories.map(
        (rec, i) => rec > 0 && (
        <div
          key={i}
          className="group/percents relative h-full min-w-max flex-initial text-center first:rounded-l-lg last:rounded-r-lg"
          style={{ flexBasis: `${(rec / total) * 100}%` }}
        >
          <span
            className={classNames(
              'hover:bg-opacity-50 transition-colors inline-block w-full cursor-default px-1',
              i === 0 && 'rounded-l',
              i === allCategories.length - 1 && 'rounded-r',
              colors[i],
            )}
          >
            {rec}
          </span>
          <span className="absolute bottom-full left-1/2 mb-2 hidden w-28 -translate-x-1/2 rounded-md bg-black px-2 py-1 text-white group-hover/percents:block">
            {`${rec} students voted ${allCategories.length - i}/${allCategories.length}`}
          </span>
        </div>
        ),
      )}
    </div>
  );
}
