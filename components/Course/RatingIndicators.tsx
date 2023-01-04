import React, { useMemo } from 'react';
import {
  FaHourglassHalf, FaStar, FaStarHalfAlt, FaUserFriends,
} from 'react-icons/fa';

/**
 * Scale of one to five stars.
 */
export function StarRating({ rating }: { rating: number; }) {
  const stars = useMemo(() => getStars(rating), [rating]);

  return (
    <div className="flex items-center space-x-1">
      {stars.map((star, i) => (star === 'half'
        ? (
          <FaStarHalfAlt
            // eslint-disable-next-line react/no-array-index-key
            key={i}
            color="orange"
            className="text-sm"
          />
        )
        : (
          <FaStar
            // eslint-disable-next-line react/no-array-index-key
            key={i}
            color={star === 'full' ? 'yellow' : 'gray'}
            className="text-sm"
          />
        )))}
      <span className="text-sm">
        {rating.toFixed(2)}
      </span>
    </div>
  );
}

export function ClassSizeRating({ population }: { population: number }) {
  const stars = useMemo(() => getStars(Math.log(population)), [population]);

  return (
    <div className="flex items-center space-x-1">
      {stars.map((star, i) => (star === 'half'
        ? (
          <FaUserFriends
          // eslint-disable-next-line react/no-array-index-key
            key={i}
            color="orange"
            className="text-sm"
          />
        )
        : (
          <FaUserFriends
            // eslint-disable-next-line react/no-array-index-key
            key={i}
            color={star === 'full' ? 'yellow' : 'gray'}
            className="text-sm"
          />
        )))}
      <span className="text-sm">
        {Math.floor(population)}
      </span>
    </div>
  );
}

export function HoursRating({ hours }: { hours: number }) {
  // 5 stars approximately corresponds to 16 hours
  const stars = useMemo(() => getStars(Math.log(hours) * 1.8), [hours]);

  return (
    <div className="flex items-center space-x-1">
      {stars.map((star, i) => (star === 'half'
        ? (
          <FaHourglassHalf
          // eslint-disable-next-line react/no-array-index-key
            key={i}
            color="orange"
            className="text-sm"
          />
        )
        : (
          <FaHourglassHalf
            // eslint-disable-next-line react/no-array-index-key
            key={i}
            color={star === 'full' ? 'yellow' : 'gray'}
            className="text-sm"
          />
        )))}
      <span className="text-sm">
        {hours.toFixed(2)}
      </span>
    </div>
  );
}


/**
 * @param value from 0 to 5.
 * @returns a flat array filled with "full", "half", or "empty".
 */
export function getStars(value: number): ('full' | 'half' | 'empty')[] {
  const halfStars = value - Math.floor(value) >= 0.5 ? 1 : 0;
  const fullStars = Math.min(Math.max(Math.floor(value), 0), 5 - halfStars);
  const emptyStars = 5 - fullStars - halfStars;
  return [...Array(fullStars).fill('full'), ...Array(halfStars).fill('half'), ...Array(emptyStars).fill('empty')];
}
