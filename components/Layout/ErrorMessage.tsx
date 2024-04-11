import { PropsWithChildren } from 'react';


export function ErrorMessage({ children }: PropsWithChildren<{}>) {
  return (
    <p className="mx-auto mt-8 max-w-3xl rounded-xl bg-red p-8 shadow">
      {children}
    </p>
  );
}
