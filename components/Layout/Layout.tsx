/* eslint-disable jsx-a11y/anchor-is-valid */
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import React from 'react';
import { classNames } from '../../shared/util';
import ExternalLink from '../ExternalLink';
import Navbar from './Navbar';

type LayoutProps = {
  title?: string;
  size?: string;
};

const Layout: React.FC<LayoutProps> = function ({ children, title, size = 'container' }) {
  const { query } = useRouter();
  const pageTitle = `Plan Crimson${title ? ` | ${title}` : ''}`;
  return (
    <div className="flex flex-col min-h-screen overflow-auto justify-around">
      <Head>
        <title>{pageTitle}</title>
        <link rel="icon" href="favicon.svg" type="image/x-icon" />
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content="Wait no longer to plan out your concentration. For Harvard College students." />
        <meta property="og:image" content="favicon.svg" />
        <meta property="og:url" content="https://plancrimson.xyz/" />
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
            <ExternalLink href="https://my.harvard.edu/">
              my.harvard
            </ExternalLink>
          </span>
          <span>
            &#169; 2022 Alexander Cai | alexcai [at] college
          </span>
          <span>
            Logo
            {' '}
            <ExternalLink href="https://fontawesome.com/license">
              &#169; 2018 FontAwesome
            </ExternalLink>
          </span>
          <span>
            Course metadata and evaluations
            {' '}
            <ExternalLink href="https://www.harvard.edu/">
              &#169; 2022 The President and Fellows of Harvard College
            </ExternalLink>
          </span>
          <span>
            <ExternalLink href="https://account.venmo.com/u/Alexander-Cai-1">
              Buy me a coffee
            </ExternalLink>
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
