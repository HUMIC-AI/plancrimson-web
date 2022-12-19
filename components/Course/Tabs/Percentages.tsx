import React from 'react';
import { classNames } from '../../../shared/util';

const colors = [
  'bg-blue-300',
  'bg-yellow-300',
  'bg-green-300',
  'bg-gray-300',
  'bg-red-300',
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
    <div className="flex h-6 rounded shadow-md">
      {allCategories.map(
        (rec, i) => rec > 0 && (
        <div
              // eslint-disable-next-line react/no-array-index-key
          key={i}
          className="group relative h-full min-w-max flex-initial text-center first:rounded-l-lg last:rounded-r-lg"
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
          <span className="absolute bottom-full left-1/2 mb-2 hidden w-28 -translate-x-1/2 rounded-md bg-gray-800 py-1 px-2 text-white group-hover:block">
            {`${rec} students voted ${allCategories.length - i}/${allCategories.length}`}
          </span>
        </div>
        ),
      )}
    </div>
  );
}
