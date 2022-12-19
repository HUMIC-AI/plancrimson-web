import { Disclosure, Menu, Transition } from '@headlessui/react';
import { signOut, getAuth } from 'firebase/auth';
import Link from 'next/link';
import { useRouter } from 'next/router';
import {
  FaTimes, FaBars, FaCalendarCheck,
} from 'react-icons/fa';
import { classNames } from '../../shared/util';
import { Auth, Profile } from '../../src/features';
import {
  handleError, signInUser, useAppDispatch, useAppSelector,
} from '../../src/hooks';
import { ImageWrapper } from '../UserLink';


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
          <div className="mx-auto max-w-7xl px-2 sm:px-6 lg:px-8">
            <div className="relative flex h-16 items-center justify-between">
              <SmallComponents.MenuButton open={open} />

              <div className="flex flex-1 items-center justify-center sm:items-stretch sm:justify-start">
                <div className="flex shrink-0 items-center text-white">
                  <Link href="/home">
                    <a>
                      {/* this on <lg */}
                      <FaCalendarCheck className="block h-8 w-auto lg:hidden" />
                      {/* this on >=lg */}
                      <div className="hidden items-center gap-4 lg:flex">
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
          className="inline-flex items-center justify-center rounded-md p-2 text-gray-300 hover:bg-gray-800 hover:text-white focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
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
              <Link href={item.href}>
                <a
                  className={classNames(
                    item.href === pathname
                      ? 'bg-gray-800 text-white font-bold'
                      : 'text-gray-300 font-medium hover:bg-gray-800 hover:text-white',
                    'block px-3 py-2 rounded-md text-base',
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
    const { pathname } = useRouter();

    return (
      <div className="hidden sm:ml-6 sm:block">
        <div className="flex items-center space-x-4">
          {paths.map((item) => (
            // pass the query between pages to preserve the selected schedule
            <Link key={item.name} href={item.href}>
              <a
                className={classNames(
                  item.href === pathname
                    ? 'bg-gray-800 text-white font-bold'
                    : 'text-gray-300 hover:bg-gray-800 font-medium hover:text-white',
                  'px-3 py-2 rounded-md text-sm text-center',
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
  const photoUrl = useAppSelector(Profile.selectPhotoUrl);
  const uid = Auth.useAuthProperty('uid');
  const email = Auth.useAuthProperty('email');

  const buttonStyles = (active: boolean) => classNames(
    active ? 'bg-white' : '',
    'block w-full text-sm text-left text-gray-800',
  );

  return (
    <Menu as="div" className="relative z-10 ml-3">
      <Menu.Button
        name="Open user menu"
        className="flex items-center rounded-full bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-gray-800"
      >
        <span className="sr-only">Open user menu</span>
        <ImageWrapper url={photoUrl} />
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
            <span className="text-xs text-gray-500">{email}</span>
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
                      dispatch(Auth.setAuthInfo(null));
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
