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

const Percentages: React.FC<Props> = function ({ categories: allCategories }) {
  if (!allCategories) return <p>Unknown</p>;

  const total = allCategories.reduce((acc, val) => acc + val, 0);

  return (
    <div className="rounded h-6 flex shadow-md">
      {allCategories.map(
        (rec, i) => rec > 0 && (
        <div
              // eslint-disable-next-line react/no-array-index-key
          key={i}
          className="group flex-initial h-full text-center min-w-max relative first:rounded-l-lg last:rounded-r-lg"
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
          <span className="hidden group-hover:block w-28 absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white rounded-md py-1 px-2">
            {rec}
            {' '}
            students voted
            {allCategories.length - i}
            /
            {allCategories.length}
          </span>
        </div>
        ),
      )}
    </div>
  );
};

export default Percentages;
