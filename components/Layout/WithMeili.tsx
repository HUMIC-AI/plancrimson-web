import React, { PropsWithChildren } from 'react';
import dynamic from 'next/dynamic';

const DynamicMeiliProvider = dynamic(() => import('./MeiliProvider'));

/**
 * Provides access to the MeiliSearch instance.
 * Provide the signed in user id to enable.
 */
export function WithMeili({
  children,
  userId,
}: PropsWithChildren<{
  userId?: string | null;
}>) {
  if (!userId) return <>{children}</>;

  return (
    <DynamicMeiliProvider userId={userId}>
      {children}
    </DynamicMeiliProvider>
  );
}
