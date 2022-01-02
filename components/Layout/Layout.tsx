/* eslint-disable jsx-a11y/anchor-is-valid */
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import React from 'react';
import { classNames } from '../../shared/util';
import Navbar from './Navbar';

type LayoutProps = {
  title?: string;
  size?: string;
};

const Layout: React.FC<LayoutProps> = function ({ children, title, size = 'container' }) {
  const { query } = useRouter();
  return (
    <div className="flex flex-col min-h-screen overflow-auto justify-around">
      <Head>
        <title>
          Plan Crimson
          {title ? ` | ${title}` : ''}
        </title>
      </Head>

      <Navbar />

      <main className={classNames('sm:p-8 mx-auto flex-1', size)}>
        {children}
      </main>

      <footer className="bg-gray-800">
        <div className="p-4 container mx-auto text-white text-sm text-center flex flex-col gap-1">
          <span>
            Course data last updated 2022-01-01 21:48 GMT
          </span>
          <span>
            Data is not guaranteed to match
            {' '}
            <a href="https://my.harvard.edu/" target="_blank" rel="noreferrer" className="font-bold hover:opacity-50 transition-opacity">
              my.harvard
            </a>
          </span>
          <span>
            &#169; 2022 Alexander Cai | alexcai [at] college
          </span>
          <span>
            Logo
            {' '}
            <a href="https://fontawesome.com/license" target="_blank" rel="noreferrer" className="font-bold hover:opacity-50 transition-opacity">
              &#169; 2018 FontAwesome
            </a>
          </span>
          <span>
            Course metadata and evaluations
            {' '}
            <a href="https://www.harvard.edu/" target="_blank" rel="noreferrer" className="font-bold hover:opacity-50 transition-opacity">
              &#169; 2022 The President and Fellows of Harvard College
            </a>
          </span>
          <span>
            <a href="https://account.venmo.com/u/Alexander-Cai-1" target="_blank" rel="noreferrer" className="font-bold hover:opacity-50 transition-opacity">
              Buy me a coffee
            </a>
            {' | '}
            <Link href={{
              pathname: '/privacy',
              query,
            }}
            >
              <a className="font-bold hover:opacity-50 transition-opacity">
                Privacy
              </a>
            </Link>
          </span>
        </div>
      </footer>
    </div>
  );
};

export default Layout;
