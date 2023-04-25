import { Menu } from '@headlessui/react';
import Link from 'next/link';
import { PropsWithChildren } from 'react';

type WrapperProps = {
  onClick: () => void;
  href?: never;
} | {
  onClick?: never;
  href: string;
};

type Props = ({
  Icon: React.ComponentType<{ className: string }>;
  title: string;
}) & WrapperProps;

export function MenuButton({
  Icon, title, ...wrapperProps
}: Props) {
  return (
    <Wrapper {...wrapperProps}>
      <Icon className="mr-2" />
      {title}
    </Wrapper>
  );
}

function Wrapper({
  children, onClick, href,
}: PropsWithChildren<WrapperProps>) {
  return (
    <Menu.Item>
      {onClick ? (
        <button
          type="button"
          className="menu-button"
          onClick={onClick}
        >
          {children}
        </button>
      ) : (
        <Link
          href={href}
          className="menu-button"
        >
          {children}
        </Link>
      )}
    </Menu.Item>
  );
}
