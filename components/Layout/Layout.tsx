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
    <div>
      <Head>
        <title>
          Plan Crimson
          {title ? ` | ${title}` : ''}
        </title>
      </Head>

      <div className="flex flex-col min-h-screen justify-around">
        <Navbar />

        <main className={classNames('sm:p-8 mx-auto flex-1', size)}>
          {children}
        </main>

        <footer className="bg-gray-800">
          <div className="py-4 container mx-auto text-white text-sm text-center flex flex-col gap-1">
            <span>
              Course data last updated 2022-01-01 21:48 GMT
            </span>
            <span>
              Data is not guaranteed to match
              {' '}
              <a href="https://my.harvard.edu/">my.harvard</a>
            </span>
            <span>
              &#169; 2022 Alexander Cai | alexcai [at] college
            </span>
            <span>
              Course metadata and evaluations
              {' '}
              <a href="https://www.harvard.edu/">
                &#169; 2022 The President and Fellows of Harvard College
              </a>
            </span>
            <span>
              <a href="https://account.venmo.com/u/Alexander-Cai-1" target="_blank" rel="noreferrer">
                Buy me a coffee
              </a>
              {' | '}
              <Link href={{
                pathname: '/privacy',
                query,
              }}
              >
                <a>Privacy</a>
              </Link>
            </span>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default Layout;
