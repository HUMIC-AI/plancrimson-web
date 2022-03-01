/* eslint-disable jsx-a11y/anchor-is-valid */
import { Disclosure, Menu, Transition } from '@headlessui/react';
import {
  signOut,
  getAuth,
} from 'firebase/auth';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { Fragment } from 'react';
import {
  FaTimes, FaBars, FaCalendarCheck, FaUser,
} from 'react-icons/fa';
import { classNames } from '../../shared/util';
import { useAppSelector } from '../../src/app/hooks';
import { selectPhotoUrl } from '../../src/features/userData';
import { handleError, signInUser } from '../../src/hooks';

const paths = [
  {
    href: '/search',
    name: 'Search',
  },
  {
    href: '/',
    name: 'My Courses',
  },
  {
    href: '/schedule',
    name: 'Schedule',
  },
  {
    href: '/about',
    name: 'About',
  },
];

// Profile dropdown
const UserMenu = function () {
  const photoUrl = useAppSelector(selectPhotoUrl);

  return (
    <Menu as="div" className="ml-3 relative z-50">
      <div>
        <Menu.Button
          name="Open user menu"
          className="bg-gray-800 flex text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-white"
        >
          <span className="sr-only">Open user menu</span>
          {photoUrl ? (
            <Image
              className="h-8 w-8 rounded-full"
              src={photoUrl}
              width={32}
              height={32}
              alt=""
            />
          ) : (
            <FaUser className="h-8 w-8 text-white" />
          )}
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
        <Menu.Items
          className={classNames(
            'origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg py-1 bg-white focus:outline-none',
          )}
        >
          <Menu.Item>
            {({ active }) => (
              <button
                type="button"
                name={photoUrl ? 'Sign out' : 'Sign in'}
                className={classNames(
                  active ? 'bg-white' : '',
                  'block w-full px-4 py-2 text-sm text-left text-gray-800',
                )}
                onClick={async () => {
                  try {
                    if (photoUrl) {
                      await signOut(getAuth());
                    } else {
                      await signInUser();
                    }
                  } catch (err) {
                    handleError(err);
                  }
                }}
              >
                {photoUrl ? 'Sign out' : 'Sign in'}
              </button>
            )}
          </Menu.Item>
        </Menu.Items>
      </Transition>
    </Menu>
  );
};

const Navbar = function () {
  const { pathname, query } = useRouter();

  return (
    <Disclosure as="nav" className="bg-gray-800">
      {({ open }) => (
        <>
          <div className="max-w-7xl mx-auto px-2 sm:px-6 lg:px-8">
            <div className="relative flex items-center justify-between h-16">
              {/* Mobile menu button */}
              <div className="absolute inset-y-0 left-0 flex items-center sm:hidden">
                <Disclosure.Button
                  name="Open main menu"
                  className="inline-flex items-center justify-center p-2 rounded-md text-gray-300 hover:text-white hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
                >
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
                  <Link href="/home">
                    <a>
                      <FaCalendarCheck className="block lg:hidden h-8 w-auto" />
                      <div className="hidden lg:flex items-center gap-4">
                        <FaCalendarCheck className="h-8 w-auto" />
                        <h1 className="text-lg">Plan Crimson</h1>
                      </div>
                    </a>
                  </Link>
                </div>
                <div className="hidden sm:block sm:ml-6">
                  <div className="flex space-x-4">
                    {paths.map((item) => (
                      // pass the query between pages to preserve the selected schedule
                      <Link
                        key={item.name}
                        href={{
                          pathname: item.href,
                          query,
                        }}
                      >
                        <a
                          className={classNames(
                            item.href === pathname
                              ? 'bg-gray-800 text-white'
                              : 'text-gray-300 hover:bg-gray-800 hover:text-white',
                            'px-3 py-2 rounded-md text-sm font-medium',
                          )}
                          aria-current={
                            item.href === pathname ? 'page' : undefined
                          }
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

          {/* The version on small screens */}
          <Disclosure.Panel className="sm:hidden">
            <div className="px-4 pb-4 flex justify-center">
              {paths.map((item) => (
                <Disclosure.Button
                  key={item.name}
                  aria-current={item.href === pathname ? 'page' : undefined}
                >
                  {/* see comment above */}
                  <Link href={{ pathname: item.href, query }}>
                    {/* eslint-disable-next-line jsx-a11y/anchor-is-valid */}
                    <a
                      className={classNames(
                        item.href === pathname
                          ? 'bg-gray-800 text-white'
                          : 'text-gray-300 hover:bg-gray-800 hover:text-white',
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
