import { Disclosure } from '@headlessui/react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import {
  FaTimes, FaBars, FaCalendarCheck,
} from 'react-icons/fa';
import { classNames } from '@/src/utils';
import { UserMenu } from './UserMenu';


const paths = [
  { href: '/search', name: 'Search' },
  { href: '/explore', name: 'Explore' },
  { href: '/connect', name: 'Connect' },
  { href: '/', name: 'My Courses' },
  { href: '/about', name: 'About' },
];

if (process.env.NODE_ENV === 'development') {
  // check if firebase project is running
  paths.push({ href: 'http://localhost:4000', name: 'Emulators' });
}


export default function Navbar({
  transparent = false,
}: {
  transparent?: boolean;
}) {
  return (
    <Disclosure
      as="nav"
      className={classNames(
        transparent ? 'absolute inset-x-0 z-10' : 'bg-black',
      )}
    >
      {({ open }) => (
        <>
          <div className="mx-auto max-w-7xl px-2 sm:px-6 lg:px-8">
            <div className="relative flex h-16 items-center justify-between">
              <SmallComponents.MenuButton open={open} />

              <div className="flex flex-1 items-center justify-center sm:items-stretch sm:justify-start">
                <div className="flex shrink-0 items-center text-white">
                  <Link href="/home">
                    {/* this on <lg */}
                    <FaCalendarCheck className="block h-8 w-auto lg:hidden" />
                    {/* this on >=lg */}
                    <div className="hidden items-center gap-4 lg:flex">
                      <FaCalendarCheck className="h-8 w-auto" />
                      <h1 className="text-lg">Plan Crimson</h1>
                    </div>
                  </Link>
                </div>

                <LargeOnly.Paths />
              </div>
              <div className="absolute inset-y-0 right-0 flex items-center pr-2 sm:static sm:inset-auto sm:ml-6 sm:pr-0">
                <UserMenu />
              </div>
            </div>
          </div>

          <SmallComponents.Paths />
        </>
      )}
    </Disclosure>
  );
}


const SmallComponents = {
  MenuButton({ open } : { open: boolean }) {
    return (
      <div className="absolute inset-y-0 left-0 flex items-center sm:hidden">
        <Disclosure.Button
          name="Open main menu"
          className={classNames(
            'inline-flex items-center justify-center rounded-md p-2',
            'text-gray-light hover:bg-black hover:text-white',
            'focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white',
          )}
        >
          <span className="sr-only">Open main menu</span>
          {open ? (
            <FaTimes className="block h-6 w-6" aria-hidden="true" />
          ) : (
            <FaBars className="block h-6 w-6" aria-hidden="true" />
          )}
        </Disclosure.Button>
      </div>
    );
  },
  Paths() {
    const { pathname } = useRouter();

    return (
      <Disclosure.Panel className="sm:hidden">
        <div className="flex justify-center px-4 pb-4">
          {paths.map((item) => (
            <Disclosure.Button
              key={item.name}
              aria-current={item.href === pathname ? 'page' : undefined}
            >
              <Link
                href={item.href}
                className={classNames(
                  item.href === pathname
                    ? 'bg-gray-dark text-white font-bold'
                    : 'text-gray-light font-medium hover:bg-black hover:text-white',
                  'block px-3 py-2 rounded-md text-base',
                )}
              >
                {item.name}
              </Link>
            </Disclosure.Button>
          ))}
        </div>
      </Disclosure.Panel>
    );
  },
};


const LargeOnly = {
  Paths() {
    const { pathname } = useRouter();

    return (
      <div className="hidden sm:ml-6 sm:block">
        <div className="flex items-center space-x-4">
          {paths.map((item) => (
            // pass the query between pages to preserve the selected schedule
            <Link
              key={item.name}
              href={item.href}
              className={classNames(
                item.href === pathname
                  ? 'bg-gray-dark text-white font-bold'
                  : 'text-gray-light hover:bg-black font-medium hover:text-white',
                'px-3 py-2 rounded-md text-sm text-center',
              )}
              aria-current={item.href === pathname ? 'page' : 'false'}
            >
              {item.name}
            </Link>
          ))}
        </div>
      </div>
    );
  },
};


