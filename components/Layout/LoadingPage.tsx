import React from 'react';

export function LoadingBars() {
  return (
    <ul className="w-full space-y-4">
      {Array.from({ length: 5 }).map((_, i) => (
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

export function LoadingText() {
  return (
    <div className="animate-pulse rounded-full bg-gray-secondary px-4 py-2">
      Loading results...
    </div>
  );
}
