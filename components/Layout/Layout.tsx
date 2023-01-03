/* eslint-disable jsx-a11y/anchor-is-valid */
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import React, { PropsWithChildren } from 'react';
import type { QueryConstraint } from 'firebase/firestore';
import useSchedules from 'src/schedules';
import { unsplashParams } from '../../shared/util';
import ExternalLink from '../ExternalLink';
import CustomModal from '../CustomModal';
import Navbar from './Navbar';
import { MeiliProvider } from '../../src/meili';
import Alerts from './Alerts';

export interface LayoutProps {
  title?: string;
  className?: string;
  scheduleQueryConstraints?: QueryConstraint[];
  custom?: boolean;
}

export function Footer() {
  const { query } = useRouter();

  return (
    <footer className="bg-gray-800">
      <div className="container mx-auto flex flex-col space-y-1 p-4 text-center text-sm text-white">
        <span>Course data last updated 2023-01-03</span>
        <span>
          &#169; 2023 Alexander Cai | alexcai [at] college |
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
            className="interactive font-bold"
          >
            Attributions
          </Link>
        </span>
        <span>
          Course metadata and evaluations
          {' '}
          <ExternalLink href="https://www.harvard.edu/">
            &#169; 2023 The President and Fellows of Harvard College
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
            className="interactive font-bold"
          >
            Privacy
          </Link>
        </span>
      </div>
    </footer>
  );
}

export default function Layout({
  children,
  title,
  className = 'mx-auto flex-1 container sm:p-8',
  scheduleQueryConstraints: constraints = [],
  custom = false,
}: PropsWithChildren<LayoutProps>) {
  const pageTitle = `Plan Crimson${title ? ` | ${title}` : ''}`;

  const description = 'Wait no longer to plan out your concentration. For Harvard College students. Q Reports, Course Evaluations, my.harvard, and more, all in one place.';

  return (
    <>
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

      <MeiliProvider>
        <Wrapper scheduleQueryConstraints={constraints} custom={custom} className={className}>
          {children}
        </Wrapper>

        <CustomModal />
      </MeiliProvider>
    </>
  );
}

function Wrapper({
  children, scheduleQueryConstraints: constraints = [], custom, className,
}: PropsWithChildren<Pick<LayoutProps, 'scheduleQueryConstraints' | 'custom' | 'className'>>) {
  useSchedules(constraints);

  if (custom) return <>{children}</>;

  return (
    <>
      <div className="flex min-h-screen flex-col">
        <Navbar />
        <Alerts />
        <main className={className}>
          {children}
        </main>
      </div>

      <Footer />
    </>
  );
}

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

export function ErrorPage({ children }: PropsWithChildren<{}>) {
  return (
    <Layout className="flex flex-1 flex-col items-center">
      <p className="mt-8 rounded-xl bg-red-300 p-8 shadow">
        {children}
      </p>
    </Layout>
  );
}

export const errorMessages = {
  unauthorized: 'You are not authorized to access this content!',
  meiliClient: 'There was an error getting the search client. Please try again later',
};
