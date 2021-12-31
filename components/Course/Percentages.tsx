import React from 'react';
import { classNames } from '../../shared/util';

const colors = ['bg-blue-300', 'bg-yellow-300', 'bg-green-300', 'bg-gray-300', 'bg-red-300'];

type Props = { categories: Array<number> };

const Percentages: React.FC<Props> = function ({ categories }) {
  const total = categories.reduce((acc, val) => acc + val, 0);

  return (
    <div className="rounded overflow-hidden h-6">
      {categories
        .filter((val) => val > 0)
        .reverse()
        .map((rec, i) => (
          <div
            // eslint-disable-next-line react/no-array-index-key
            key={i}
            className={classNames(
              'inline-block h-full text-center',
              colors[i],
            )}
            style={{ width: `${(rec / total) * 100}%` }}
          >
            {rec}
          </div>
        ))}
    </div>
  );
};

export default Percentages;
