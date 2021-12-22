/* eslint-disable jsx-a11y/anchor-is-valid */
import Head from 'next/head';
import Image from 'next/image';
import Link from 'next/link';
import React from 'react';
import { useUser } from '../src/userContext';

const Layout: React.FC<{ title?: string; } > = function ({ children, title }) {
  const { user } = useUser();

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
              <a>
                <li>
                  Home
                </li>
              </a>
            </Link>
            <Link href="/admin">
              <a>
                <li>
                  Admin
                </li>
              </a>
            </Link>
            <Link href="/search">
              <a>
                <li>
                  Search
                </li>
              </a>
            </Link>
            {user?.photoURL && (
            <div className="w-8 h-8 rounded-full relative overflow-hidden">
              <Image src={user.photoURL} layout="fill" />
            </div>
            )}
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
