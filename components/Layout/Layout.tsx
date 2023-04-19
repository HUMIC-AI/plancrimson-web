/* eslint-disable jsx-a11y/anchor-is-valid */
import Head from 'next/head';
import React, { PropsWithChildren } from 'react';
import type { QueryConstraint } from 'firebase/firestore';
import useSchedules from 'src/schedules';
import CustomModal from '../CustomModal';
import Navbar from './Navbar';
import { MeiliProvider } from '@/src/meili';
import Alerts from './Alerts';
import { Footer } from './Footer';

export interface LayoutProps {
  title?: string;
  className?: string;
  scheduleQueryConstraints?: QueryConstraint[];
  custom?: boolean;
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

export const errorMessages = {
  unauthorized: 'You are not authorized to access this content!',
  meiliClient: 'There was an error getting the search client. Please try again later',
};
