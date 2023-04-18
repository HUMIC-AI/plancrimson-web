import React from 'react';
import Layout from './Layout';


export function LoadingPage() {
  return (
    <Layout>
      <ul className="space-y-4">
        {new Array(5).fill(null).map((_, i) => (
          <li
            // eslint-disable-next-line react/no-array-index-key
            key={i}
            className="animate-pulse rounded bg-blue-300"
            style={{ animationDelay: `${i * 250}ms` }}
          >
            &nbsp;
          </li>
        ))}
      </ul>
    </Layout>
  );
}
