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
import { Auth, Profile } from '../../src/features';
import {
  handleError, signInUser, useAppDispatch, useAppSelector,
} from '../../src/hooks';


const paths = [
  { href: '/search', name: 'Search' },
  { href: '/explore', name: 'Explore' },
  { href: '/connect', name: 'Connect' },
  { href: '/', name: 'My Courses' },
  { href: '/about', name: 'About' },
];


export default function Navbar() {
  return (
    <Disclosure as="nav" className="bg-gray-800">
      {({ open }) => (
        <>
          <div className="max-w-7xl mx-auto px-2 sm:px-6 lg:px-8">
            <div className="relative flex items-center justify-between h-16">
              <SmallComponents.MenuButton open={open} />

              <div className="flex-1 flex items-center justify-center sm:items-stretch sm:justify-start">
                <div className="flex-shrink-0 flex items-center text-white">
                  <Link href="/home">
                    <a>
                      {/* this on <lg */}
                      <FaCalendarCheck className="block lg:hidden h-8 w-auto" />
                      {/* this on >=lg */}
                      <div className="hidden lg:flex items-center gap-4">
                        <FaCalendarCheck className="h-8 w-auto" />
                        <h1 className="text-lg">Plan Crimson</h1>
                      </div>
                    </a>
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
    );
  },
  Paths() {
    const { pathname, query } = useRouter();

    return (
      <Disclosure.Panel className="sm:hidden">
        <div className="px-4 pb-4 flex justify-center">
          {paths.map((item) => (
            <Disclosure.Button
              key={item.name}
              aria-current={item.href === pathname ? 'page' : undefined}
            >
              <Link href={{ pathname: item.href, query }}>
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
    );
  },
};


const LargeOnly = {
  Paths() {
    const { pathname, query } = useRouter();

    return (
      <div className="hidden sm:block sm:ml-6">
        <div className="flex space-x-4 items-center">
          {paths.map((item) => (
            // pass the query between pages to preserve the selected schedule
            <Link
              key={item.name}
              href={{ pathname: item.href, query }}
            >
              <a
                className={classNames(
                  item.href === pathname
                    ? 'bg-gray-800 text-white'
                    : 'text-gray-300 hover:bg-gray-800 hover:text-white',
                  'px-3 py-2 rounded-md text-sm font-medium text-center',
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
    );
  },
};


// Profile dropdown
function UserMenu() {
  const dispatch = useAppDispatch();
  const username = useAppSelector(Profile.selectUsername);
  const uid = Auth.useAuthProperty('uid');
  const photoUrl = Auth.useAuthProperty('photoUrl');
  const email = Auth.useAuthProperty('email');

  const buttonStyles = (active: boolean) => classNames(
    active ? 'bg-white' : '',
    'block w-full text-sm text-left text-gray-800',
  );

  return (
    <Menu as="div" className="ml-3 relative z-50">
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

      <Transition
        enter="transition ease-out duration-100"
        enterFrom="transform opacity-0 scale-95"
        enterTo="transform opacity-100 scale-100"
        leave="transition ease-in duration-75"
        leaveFrom="transform opacity-100 scale-100"
        leaveTo="transform opacity-0 scale-95"
      >
        <Menu.Items
          className={classNames(
            'origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg px-4 py-2 bg-white space-y-2 focus:outline-none',
          )}
        >
          {email && (
          <Menu.Item>
            <span className="text-gray-500 text-xs">{email}</span>
          </Menu.Item>
          )}

          {uid && (
          <Menu.Item>
            {({ active }) => (
              <Link href={`/user/${username}`}>
                <a className={buttonStyles(active)}>Profile</a>
              </Link>
            )}
          </Menu.Item>
          )}

          <Menu.Item>
            {({ active }) => (
              <button
                type="button"
                name={uid ? 'Sign out' : 'Sign in'}
                className={buttonStyles(active)}
                onClick={async () => {
                  try {
                    if (uid) {
                      await signOut(getAuth());
                      dispatch(Auth.signOut());
                    } else {
                      await signInUser();
                    }
                  } catch (err) {
                    handleError(err);
                  }
                }}
              >
                {uid ? 'Sign out' : 'Sign in'}
              </button>
            )}
          </Menu.Item>
          {process.env.NODE_ENV === 'development' && uid && (
          <Menu.Item>
            {({ active }) => (
              <button
                type="button"
                onClick={() => prompt('UID', uid)}
                className={buttonStyles(active)}
              >
                Copy UID
              </button>
            )}
          </Menu.Item>
          )}
        </Menu.Items>
      </Transition>
    </Menu>
  );
}
