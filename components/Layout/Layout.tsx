import Head from 'next/head';
import React, { PropsWithChildren } from 'react';
import CustomModal from '../CustomModal';
import Navbar from './Navbar';
import Alerts from './Alerts';
import { Footer } from './Footer';
import { WithMeili } from './WithMeili';

export interface LayoutProps {
  title?: string;
  className?: string;
  withMeili?: boolean;
  transparentHeader?: boolean;
}

/**
 * Layout component that wraps around all pages.
 */
export default function Layout({
  children,
  title,
  withMeili,
  ...props
}: PropsWithChildren<LayoutProps>) {
  const pageTitle = `PlanCrimson${title ? ` | ${title}` : ''}`;

  return (
    <WithMeili enabled={withMeili}>
      <HeadMeta pageTitle={pageTitle} description={description} />

      <Wrapper {...props}>
        {children}
      </Wrapper>

      <Footer />

      <CustomModal />
    </WithMeili>
  );
}

export function HeadMeta({
  pageTitle, description,
}: { pageTitle: string, description: string }) {
  return (
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
  );
}

const LAYOUT_CLASSES = 'mx-auto flex-1 container sm:p-8 bg-secondary';

/**
 * Listen to the schedules given by the constraints.
 * Goes inside the meilisearch wrapper.
 */
function Wrapper({
  children,
  className = LAYOUT_CLASSES,
  transparentHeader = false,
}: PropsWithChildren<Pick<LayoutProps, 'className' | 'transparentHeader'>>) {
  return (
    <div className="flex min-h-screen flex-col bg-secondary text-primary">
      <Navbar transparent={transparentHeader} />
      <Alerts />
      <main className={className}>
        {children}
      </main>
    </div>
  );
}

export const errorMessages = {
  unauthorized: 'You are not authorized to access this content!',
  meiliClient: 'There was an error getting the search client. Please try again later',
};

export const description = 'Wait no longer to plan out your concentration. For Harvard College students. Q Reports, Course Evaluations, my.harvard, and more, all in one place.';
