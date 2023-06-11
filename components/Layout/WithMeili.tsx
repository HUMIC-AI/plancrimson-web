import React, { PropsWithChildren } from 'react';
import dynamic from 'next/dynamic';

const DynamicMeiliProvider = dynamic(() => import('./MeiliProvider'));

export function WithMeili({
  children,
  enabled = false,
}: PropsWithChildren<{
  enabled?: boolean;
}>) {
  if (!enabled) return <>{children}</>;

  return (
    <DynamicMeiliProvider>
      {children}
    </DynamicMeiliProvider>
  );
}
