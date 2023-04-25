import { Menu } from '@headlessui/react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import {
  FaTimes, FaBars, FaCalendarCheck, FaChevronDown,
} from 'react-icons/fa';
import { classNames } from '@/src/utils/styles';
import { UserMenu } from './UserMenu';


type Path = {
  href: string;
  name: string;
  children?: Path[];
};

const paths: Path[] = [
  { href: '/search', name: 'Search' },
  {
    href: '/explore',
    name: 'Explore',
    children: [
      { href: '/explore/undergrad', name: 'Undergrad' },
      { href: '/explore/grad', name: 'Grad' },
    ],
  },
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
    <Menu
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
                      <h2>Plan Crimson</h2>
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


function NavbarLink({ item, pathname, isParent = false }: { item: Path, pathname: string; isParent?: boolean }) {
  const isCurrent = item.href === pathname || (item.children?.some((child) => child.href === pathname));

  const blockStyles = classNames(
    isCurrent
      ? 'bg-gray-dark/70 text-white font-semibold'
      : 'text-gray-light font-medium hover:text-white',
    'block relative hover:bg-gray-dark px-3 py-2 rounded-md text-center transition-colors',
    'sm:flex sm:items-center sm:text-sm',
  );

  return isParent ? (
    <div className={blockStyles}>
      <Link href={item.href} aria-current={isCurrent ? 'page' : 'false'}>{item.name}</Link>
      <FaChevronDown className={classNames('absolute right-2 top-1/2 -translate-y-1/2', 'sm:ml-2 sm:static sm:translate-y-0')} />
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
        </Menu.Button>
      </div>
    );
  },
  Paths() {
    const { pathname } = useRouter();

    return (
      <Menu.Items className="bg-gray-dark/50 sm:hidden">
        <div className="flex flex-col justify-center p-4">
          {paths.map((item) => (
            <Menu.Item
              key={item.name}
              aria-current={item.href === pathname ? 'page' : undefined}
            >
              {item.children ? (
                <SubMenu item={item} />
              ) : (
                <NavbarLink item={item} pathname={pathname} />
              )}
            </Menu.Item>
          ))}
        </div>
      </Menu.Items>
    );
  },
};


const LargeOnly = {
  Paths() {
    const { pathname } = useRouter();

    return (
      <div className="hidden items-center space-x-4 sm:ml-6 sm:flex">
        {paths.map((item) => (
          // pass the query between pages to preserve the selected schedule
          item.children ? (
            <div key={item.name} className="group/nav relative">
              <NavbarLink key={item.name} item={item} pathname={pathname} isParent />
              <div className="absolute left-1/2 top-full z-10 hidden -translate-x-1/2 rounded bg-black/80 group-hover/nav:block">
                {item.children.map((child) => (
                  <NavbarLink key={child.name} item={child} pathname={pathname} />
                ))}
              </div>
            </div>
          ) : (
            <NavbarLink key={item.name} item={item} pathname={pathname} />
          )
        ))}
      </div>
    );
  },
};


function SubMenu({ item }: { item: Path }) {
  const { pathname } = useRouter();

  return (
    <Menu as="div">
      <Menu.Button className="w-full">
        <NavbarLink item={item} pathname={pathname} isParent />
      </Menu.Button>
      <Menu.Items className="rounded bg-black/40">
        {item.children!.map((child) => (
          <Menu.Item key={child.name}>
            <NavbarLink item={child} pathname={pathname} />
          </Menu.Item>
        ))}
      </Menu.Items>
    </Menu>
  );
}

