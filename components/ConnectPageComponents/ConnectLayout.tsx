import Layout, { LayoutProps } from 'components/Layout/Layout';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { PropsWithChildren } from 'react';

export default function ConnectLayout({ children, className = '', ...props }: PropsWithChildren<LayoutProps>) {
  return (
    <Layout className={`${className} mx-auto w-full max-w-screen-md flex-1 p-8`} {...props}>
      <ConnectNavbar />
      {children}
    </Layout>
  );
}

function ConnectNavbar() {
  const { pathname } = useRouter();

  const routes: Array<[string, string]> = [
    ['/connect', 'Public schedules'],
    ['/connect/friends', 'Friends'],
  ];

  return (
    <ul className="mb-4 flex justify-between">
      {routes.map(([path, title]) => (
        <li key={path} className={`interactive flex-1 border-black text-center font-bold ${pathname === path ? 'border-b' : ''}`}>
          <Link href={path} className="block h-full w-full">{title}</Link>
        </li>
      ))}
    </ul>
  );
}
