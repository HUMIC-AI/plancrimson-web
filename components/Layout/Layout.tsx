/* eslint-disable jsx-a11y/anchor-is-valid */
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import React from 'react';
import { classNames, unsplashParams } from '../../shared/util';
import ExternalLink from '../ExternalLink';
import CustomModal from '../CustomModal';
import Navbar from './Navbar';

type LayoutProps = {
  title?: string;
  size?: string;
};

const description = 'Wait no longer to plan out your concentration. For Harvard College students. Q Reports, Course Evaluations, my.harvard, and more, all in one place.';

function Footer() {
  const { query } = useRouter();

  return (
    <footer className="bg-gray-800">
      <div className="p-4 container mx-auto text-white text-sm text-center flex flex-col space-y-1">
        <span>Course data last updated 2022-01-15</span>
        <span>
          &#169; 2022 Alexander Cai | alexcai [at] college |
          {' '}
          <ExternalLink href="https://account.venmo.com/u/Alexander-Cai-1">
            Buy me a coffee
          </ExternalLink>
        </span>
        <span>
          Logo
          {' '}
          <ExternalLink href="https://fontawesome.com/license">
            &#169; 2018 FontAwesome
          </ExternalLink>
          {' '}
          | Images from
          {' '}
          <ExternalLink href={`https://unsplash.com/${unsplashParams}`}>
            Unsplash
          </ExternalLink>
          {' '}
          |
          {' '}
          <Link
            href={{
              pathname: '/privacy',
              query,
            }}
          >
            <a className="font-bold hover:opacity-50 transition-opacity">
              Attributions
            </a>
          </Link>
        </span>
        <span>
          Course metadata and evaluations
          {' '}
          <ExternalLink href="https://www.harvard.edu/">
            &#169; 2022 The President and Fellows of Harvard College
          </ExternalLink>
        </span>
        <span>
          Data is not guaranteed to match
          {' '}
          <ExternalLink href="https://my.harvard.edu/">
            my.harvard
          </ExternalLink>
        </span>
        <span>
          <Link
            href={{
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
  );
}

const Layout: React.FC<LayoutProps> = function ({
  children,
  title,
  size = 'container sm:p-8',
}) {
  const pageTitle = `Plan Crimson${title ? ` | ${title}` : ''}`;
  return (
    <div className="flex flex-col min-h-screen overflow-auto">
      <Head>
        <title>{pageTitle}</title>
        <link rel="icon" href="favicon.svg" type="image/x-icon" />
        <meta name="description" content={description} />
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={description} />
        <meta property="og:image" content="https://plancrimson.xyz/demo.png" />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://plancrimson.xyz/" />
      </Head>

      <Navbar />

      <main className={classNames('mx-auto flex-1', size)}>
        {children}
      </main>

      <Footer />

      <CustomModal />
    </div>
  );
};

export default Layout;
