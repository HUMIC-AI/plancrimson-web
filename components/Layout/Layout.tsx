/* eslint-disable jsx-a11y/anchor-is-valid */
import Head from 'next/head';
import React from 'react';
import Navbar from './Navbar';

const Layout: React.FC<{ title?: string; } > = function ({ children, title }) {
  return (
    <div>
      <Head>
        <title>
          Harvard Concentration Planner
          {title ? ` | ${title}` : ''}
        </title>
      </Head>

      <div className="flex flex-col min-h-screen">
        <Navbar />

        <main className="sm:p-8 container mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;
