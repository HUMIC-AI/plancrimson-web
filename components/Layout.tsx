/* eslint-disable jsx-a11y/anchor-is-valid */
import { Menu } from '@headlessui/react';
import { getAuth, GoogleAuthProvider, signOut } from 'firebase/auth';
import Head from 'next/head';
import Image from 'next/image';
import Link from 'next/link';
import React from 'react';
import StyledFirebaseAuth from 'react-firebaseui/StyledFirebaseAuth';
import { useUser } from '../src/userContext';
import FadeTransition from './FadeTransition';

const paths = [
  {
    href: '/',
    name: 'Home',
  },
  {
    href: 'admin',
    name: 'Admin',
  },
  {
    href: '/search',
    name: 'Search',
  },
  {
    href: '/resources',
    name: 'Resources',
  },
];

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
        <h1 className="text-xl text-center">
          {title || 'Harvard Concentration Planner'}
        </h1>
        <nav>
          <ul className="flex justify-around items-center">
            {paths.map(({ href, name }) => (
              <Link href={href} key={href}>
                <a>
                  <li>{name}</li>
                </a>
              </Link>
            ))}
            {user?.photoURL ? (
              <Menu as="div" className="relative inline-block text-left">
                <Menu.Button className="w-8 h-8 rounded-full overflow-hidden shadow relative focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-opacity-75">
                  <Image src={user.photoURL} layout="fill" />
                </Menu.Button>
                <FadeTransition>
                  <Menu.Items className="absolute right-0 mt-2">
                    <Menu.Item>
                      <button
                        type="button"
                        className="bg-blue-300 py-2 px-3 rounded hover:bg-blue-500 transition-colors w-max z-20"
                        onClick={() => {
                          signOut(getAuth());
                        }}
                      >
                        Sign out
                      </button>
                    </Menu.Item>
                  </Menu.Items>
                </FadeTransition>
              </Menu>
            ) : (
              <StyledFirebaseAuth
                uiConfig={{
                  signInOptions: [GoogleAuthProvider.PROVIDER_ID],
                  callbacks: {
                    signInSuccessWithAuthResult: () => false,
                  },
                }}
                firebaseAuth={getAuth()}
              />
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
