import React, { PropsWithChildren } from 'react';
import Layout from './Layout';


export function ErrorPage({ children }: PropsWithChildren<{}>) {
  return (
    <Layout className="flex flex-1 flex-col items-center">
      <ErrorMessage>
        {children}
      </ErrorMessage>
    </Layout>
  );
}

export function ErrorMessage({ children }: PropsWithChildren<{}>) {
  return (
    <p className="mt-8 rounded-xl bg-red p-8 shadow">
      {children}
    </p>
  );
}
