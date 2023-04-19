import React, { PropsWithChildren } from 'react';
import Layout from './Layout';


export function ErrorPage({ children }: PropsWithChildren<{}>) {
  return (
    <Layout className="flex flex-1 flex-col items-center">
      <p className="bg-red-300 mt-8 rounded-xl p-8 shadow">
        {children}
      </p>
    </Layout>
  );
}
