import { Menu, Transition } from '@headlessui/react';
import { signOut, getAuth } from 'firebase/auth';
import Link from 'next/link';
import { Auth, Profile } from '@/src/features';
import {
  handleError, signInUser, useAppDispatch, useAppSelector,
} from '@/src/hooks';
import { classNames } from '@/src/utils';
import { ImageWrapper } from '../UserLink';

// Profile dropdown
export function UserMenu() {
  const dispatch = useAppDispatch();
  const username = useAppSelector(Profile.selectUsername);
  const photoUrl = useAppSelector(Profile.selectPhotoUrl);
  const uid = Auth.useAuthProperty('uid');
  const email = Auth.useAuthProperty('email');

  const buttonStyles = (active: boolean) => classNames(
    active ? 'bg-white' : '',
    'block w-full text-sm text-left text-black',
  );

  return (
    <Menu as="div" className="relative z-10 ml-3">
      <Menu.Button
        name="Open user menu"
        className="flex items-center rounded-full bg-black text-sm focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-black"
      >
        <span className="sr-only">Open user menu</span>
        <ImageWrapper url={photoUrl} alt="User profile" />
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
              <span className="text-xs text-gray-dark">{email}</span>
            </Menu.Item>
          )}

          {uid && (
            <Menu.Item>
              {({ active }) => (
                <Link href={`/user/${username}`} className={buttonStyles(active)}>
                  Profile
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
