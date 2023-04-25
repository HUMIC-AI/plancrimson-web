import React from 'react';

export function LoadingBars() {
  return (
    <ul className="w-full space-y-4">
      {new Array(5).fill(null).map((_, i) => (
        <li
          key={i}
          className="animate-pulse rounded bg-blue-light"
          style={{ animationDelay: `${i * 250}ms` }}
        >
            &nbsp;
        </li>
      ))}
    </ul>
  );
}
