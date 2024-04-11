import Head from 'next/head';
import React, { PropsWithChildren } from 'react';
import CustomModal from '../Modals/CustomModal';
import { Navbar } from './Navbar';
import Alerts from './Alerts';
import { Footer } from './Footer';
import { AuthWrapper } from './AuthWrapper';
import { MESSAGES } from '../../src/utils/config';

type BaseProps = {
  title?: string;
  className?: string;
  headerStyles?: string;
  containerStyles?: string;
};

export type LayoutProps = (BaseProps & {
  verify: 'meili' | 'auth';
  children: (props: { userId: string }) => JSX.Element;
}) | PropsWithChildren<BaseProps & {
  verify?: never;
}>;

/**
 * Layout component that wraps around all pages.
 * Turning on meili implies auth.
 */
export default function Layout({
  children,
  title,
  className = LAYOUT_CLASSES,
  verify,
  headerStyles,
  containerStyles = 'primary flex min-h-screen flex-col',
}: LayoutProps) {
  const pageTitle = `PlanCrimson${title ? ` | ${title}` : ''}`;

  return (
    <>
      <HeadMeta pageTitle={pageTitle}>
        {MESSAGES.description}
      </HeadMeta>

      <div className={containerStyles}>
        <Navbar className={headerStyles} />

        <Alerts />

        {verify ? (
          <AuthWrapper meili={verify === 'meili'}>
            {({ userId }) => (
              <main className={className}>
                {children({ userId })}
              </main>
            )}
          </AuthWrapper>
        ) : (
          <main className={className}>
            {children}
          </main>
        )}
      </div>

      <Footer />

      <CustomModal />
    </>
  );
}

export function HeadMeta({
  pageTitle, children,
}: { pageTitle: string, children: string }) {
  return (
    <Head>
      <title>{pageTitle}</title>
      <link rel="icon" href="favicon.svg" type="image/x-icon" />
      <meta name="description" content={children} />
      <meta property="og:title" content={pageTitle} />
      <meta property="og:description" content={children} />
      <meta property="og:image" content="https://plancrimson.xyz/demo.png" />
      <meta property="og:type" content="website" />
      <meta property="og:url" content="https://plancrimson.xyz/" />
    </Head>
  );
}

const LAYOUT_CLASSES = 'mx-auto flex-1 container sm:p-8 bg-secondary';
