import { Menu } from '@headlessui/react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import {
  FaTimes, FaBars, FaCalendarCheck, FaChevronDown,
} from 'react-icons/fa';
import { classNames } from '@/src/utils/styles';
import { UserMenu } from './UserMenu';
import { Parent, Path, PATHS } from '../../src/utils/config';

export function Navbar({
  className = 'bg-secondary/80 text-primary',
}: {
  className?: string;
}) {
  return (
    <Menu as="nav" className={className}>
      {({ open }) => (
        <>
          <div className="mx-auto max-w-7xl px-2 sm:px-6 lg:px-8">
            <div className="relative flex h-16 items-center justify-between">
              <SmallComponents.MenuButton open={open} />

              <div className="flex flex-1 items-center justify-center sm:items-stretch sm:justify-start">
                <div className="flex shrink-0 items-center">
                  <Link href="/home">
                    {/* this on <lg */}
                    <FaCalendarCheck className="block h-8 w-auto lg:hidden" />
                    {/* this on >=lg */}
                    <div className="hidden items-center gap-4 lg:flex">
                      <FaCalendarCheck className="h-8 w-auto" />
                      <h2>
                        <span className="text-gray-primary">
                          Plan
                        </span>
                        <span className="text-blue-primary">
                          Crimson
                        </span>
                      </h2>
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
    </Menu>
  );
}


function NavbarLink({ item, pathname }: { item: Path | Parent, pathname: string }) {
  const isParent = 'children' in item;
  const isCurrent = isParent ? item.children.some((child) => child.href === pathname) : item.href === pathname;

  const blockStyles = classNames(
    isCurrent
      ? 'text-blue-primary font-semibold'
      : 'text-gray-primary',
    'block relative button flex items-center justify-center',
    'sm:flex sm:items-center sm:text-sm',
  );

  return isParent ? (
    <div className={blockStyles}>
      <span aria-current={isCurrent ? 'page' : 'false'}>{item.name}</span>
      <FaChevronDown className={classNames(
        'absolute transition-transform group-hover/nav:rotate-180 right-2 top-1/2 -translate-y-1/2',
        'sm:ml-2 sm:static sm:translate-y-0',
      )}
      />
    </div>
  ) : (
    <Link
      href={item.href}
      className={blockStyles}
      aria-current={isCurrent ? 'page' : 'false'}
    >
      {item.name}
    </Link>
  );
}


const SmallComponents = {
  MenuButton({ open } : { open: boolean }) {
    return (
      <div className="absolute inset-y-0 left-0 flex items-center sm:hidden">
        <Menu.Button
          name="Open main menu"
          className={classNames(
            'inline-flex items-center justify-center rounded-md p-2',
            'text-primary hover:bg-gray-primary transition-colors',
            'focus:outline-none focus:ring-2 focus:ring-inset focus:ring-secondary',
          )}
        >
          <span className="sr-only">Open main menu</span>
          {open ? (
            <FaTimes className="block h-6 w-6" aria-hidden="true" />
          ) : (
            <FaBars className="block h-6 w-6" aria-hidden="true" />
          )}
        </Menu.Button>
      </div>
    );
  },
  Paths() {
    const { pathname } = useRouter();

    return (
      <Menu.Items className="bg-gray-dark/50 sm:hidden">
        <div className="flex flex-col justify-center p-4">
          {PATHS.map((item) => {
            const isParent = 'children' in item;
            return (
              <Menu.Item
                key={item.name}
                aria-current={!isParent && item.href === pathname ? 'page' : undefined}
              >
                {isParent ? (
                  <SmallComponents.SubMenu item={item} />
                ) : (
                  <NavbarLink item={item} pathname={pathname} />
                )}
              </Menu.Item>
            );
          })}
        </div>
      </Menu.Items>
    );
  },
  SubMenu({ item }: { item: Parent }) {
    const { pathname } = useRouter();

    return (
      <Menu as="div">
        <Menu.Button className="w-full">
          <NavbarLink item={item} pathname={pathname} />
        </Menu.Button>
        <Menu.Items className="rounded bg-black/40">
          {item.children.map((child) => (
            <Menu.Item key={child.href}>
              <NavbarLink item={child} pathname={pathname} />
            </Menu.Item>
          ))}
        </Menu.Items>
      </Menu>
    );
  },
};


const LargeOnly = {
  Paths() {
    const { pathname } = useRouter();

    return (
      <div className="hidden items-center space-x-4 sm:ml-6 sm:flex">
        {PATHS.map((item) => {
          const isParent = 'children' in item;
          // pass the query between pages to preserve the selected schedule
          return isParent ? (
            <LargeOnly.SubMenu item={item} key={item.name} />
          ) : (
            <NavbarLink key={item.name} item={item} pathname={pathname} />
          );
        })}
      </div>
    );
  },
  SubMenu({ item }: { item: Parent }) {
    const { pathname } = useRouter();

    return (
      <div className="group/nav relative">
        <NavbarLink item={item} pathname={pathname} />

        <div className={classNames(
          'absolute inset-x-0 top-full z-10',
          'rounded-md bg-secondary/80',
          'invisible opacity-0 transition-opacity group-hover/nav:visible group-hover/nav:opacity-100',
        )}
        >
          {item.children!.map((child) => (
            <NavbarLink key={child.name} item={child} pathname={pathname} />
          ))}
        </div>
      </div>
    );
  },
};

