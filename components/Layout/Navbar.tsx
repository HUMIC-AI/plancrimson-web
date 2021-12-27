import { Disclosure, Menu, Transition } from '@headlessui/react';
import {
  signOut, getAuth, signInWithPopup, GoogleAuthProvider,
} from 'firebase/auth';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { Fragment } from 'react';
import {
  FaTimes, FaBars, FaCalendarCheck, FaUser,
} from 'react-icons/fa';
import useUser from '../../src/context/user';
import { classNames } from '../../src/util';

const paths = [
  {
    href: '/',
    name: 'Home',
  },
  {
    href: '/search',
    name: 'Search',
  },
  {
    href: '/semester',
    name: 'Semester',
  },
  {
    href: '/year',
    name: 'Plan',
  },
  {
    href: '/resources',
    name: 'Resources',
  },
];

// Profile dropdown
const UserMenu = function () {
  const { user } = useUser();

  return (
    <Menu as="div" className="ml-3 relative">
      <div>
        <Menu.Button className="bg-gray-800 flex text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-white">
          <span className="sr-only">Open user menu</span>
          {user?.photoURL
            ? (
              <Image
                className="h-8 w-8 rounded-full"
                src={user.photoURL}
                width={32}
                height={32}
                alt=""
              />
            )
            : <FaUser className="h-8 w-8 text-white" />}
        </Menu.Button>
      </div>
      <Transition
        as={Fragment}
        enter="transition ease-out duration-100"
        enterFrom="transform opacity-0 scale-95"
        enterTo="transform opacity-100 scale-100"
        leave="transition ease-in duration-75"
        leaveFrom="transform opacity-100 scale-100"
        leaveTo="transform opacity-0 scale-95"
      >
        <Menu.Items className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg py-1 bg-white ring-1 ring-black ring-opacity-5 focus:outline-none">
          {/* <Menu.Item>
            {({ active }) => (
              <a
                href="#"
                className={classNames(active ? 'bg-gray-100' : '', 'block px-4 py-2 text-sm text-gray-700')}
              >
                Your Profile
              </a>
            )}
          </Menu.Item>
          <Menu.Item>
            {({ active }) => (
              <a
                href="#"
                className={classNames(active ? 'bg-gray-100' : '', 'block px-4 py-2 text-sm text-gray-700')}
              >
                Settings
              </a>
            )}
          </Menu.Item> */}
          <Menu.Item>
            {({ active }) => (
              <button
                type="button"
                className={classNames(
                  active ? 'bg-gray-100' : '',
                  'block w-full px-4 py-2 text-sm text-left text-gray-700',
                )}
                onClick={async () => {
                  if (user) {
                    await signOut(getAuth());
                  } else {
                    const provider = new GoogleAuthProvider();
                    await signInWithPopup(getAuth(), provider);
                  }
                }}
              >
                {user ? 'Sign out' : 'Sign in'}
              </button>
            )}
          </Menu.Item>
        </Menu.Items>
      </Transition>
    </Menu>
  );
};

const Navbar = function () {
  const { pathname } = useRouter();

  return (
    <Disclosure as="nav" className="bg-gray-800">
      {({ open }) => (
        <>
          <div className="max-w-7xl mx-auto px-2 sm:px-6 lg:px-8">
            <div className="relative flex items-center justify-between h-16">

              {/* Mobile menu button */}
              <div className="absolute inset-y-0 left-0 flex items-center sm:hidden">
                <Disclosure.Button className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-white hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white">
                  <span className="sr-only">Open main menu</span>
                  {open ? (
                    <FaTimes className="block h-6 w-6" aria-hidden="true" />
                  ) : (
                    <FaBars className="block h-6 w-6" aria-hidden="true" />
                  )}
                </Disclosure.Button>
              </div>

              <div className="flex-1 flex items-center justify-center sm:items-stretch sm:justify-start">
                <div className="flex-shrink-0 flex items-center text-white">
                  <FaCalendarCheck className="block lg:hidden h-8 w-auto" />
                  <div className="hidden lg:flex items-center gap-4">
                    <FaCalendarCheck className="h-8 w-auto" />
                    <h1 className="text-lg">Harvard Concentration Planner</h1>
                  </div>
                </div>
                <div className="hidden sm:block sm:ml-6">
                  <div className="flex space-x-4">
                    {paths.map((item) => (
                      <Link key={item.name} href={item.href}>
                        {/* eslint-disable-next-line jsx-a11y/anchor-is-valid */}
                        <a
                          className={classNames(
                            item.href === pathname ? 'bg-gray-900 text-white' : 'text-gray-300 hover:bg-gray-700 hover:text-white',
                            'px-3 py-2 rounded-md text-sm font-medium',
                          )}
                          aria-current={item.href === pathname ? 'page' : undefined}
                        >
                          {item.name}
                        </a>
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
              <div className="absolute inset-y-0 right-0 flex items-center pr-2 sm:static sm:inset-auto sm:ml-6 sm:pr-0">
                <UserMenu />
              </div>
            </div>
          </div>

          <Disclosure.Panel className="sm:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1">
              {paths.map((item) => (
                <Disclosure.Button
                  key={item.name}
                  aria-current={item.href === pathname ? 'page' : undefined}
                >
                  <Link href={item.href}>
                    {/* eslint-disable-next-line jsx-a11y/anchor-is-valid */}
                    <a
                      className={classNames(
                        item.href === pathname
                          ? 'bg-gray-900 text-white'
                          : 'text-gray-300 hover:bg-gray-700 hover:text-white',
                        'block px-3 py-2 rounded-md text-base font-medium',
                      )}
                    >
                      {item.name}
                    </a>
                  </Link>
                </Disclosure.Button>
              ))}
            </div>
          </Disclosure.Panel>
        </>
      )}
    </Disclosure>
  );
};

export default Navbar;
