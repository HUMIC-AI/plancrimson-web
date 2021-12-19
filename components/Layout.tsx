import Head from 'next/head';
import Link from 'next/link';
import React from 'react';

const Layout: React.FC<{ title?: string } > = function ({ children, title }) {
  return (
    <div>
      <Head>
        <title>
          Harvard Concentration Planner
          {title ? ` | ${title}` : ''}
        </title>
      </Head>

      <header className="py-2 bg-gray-300">
        <h1 className="text-xl text-center">{title || 'Harvard Concentration Planner'}</h1>
        <nav>
          <ul className="flex justify-around items-center">
            <Link href="/">
              <li>
                Home
              </li>
            </Link>
            <Link href="/admin">
              <li>
                Admin
              </li>
            </Link>
            <Link href="/search">
              <li>
                Search
              </li>
            </Link>
          </ul>
        </nav>
      </header>

      <main className="p-8 container mx-auto">
        {children}
      </main>
    </div>
  );
};

export default Layout;
