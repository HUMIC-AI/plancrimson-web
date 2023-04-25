import { PropsWithChildren } from 'react';

type Props = {
  href: string;
  className?: string;
};

export default function ExternalLink({ href, children, className = 'interactive font-bold' }: PropsWithChildren<Props>) {
  const isMail = href.startsWith('mailto');
  return (
    <a
      href={href}
      target={isMail ? undefined : '_blank'}
      rel={isMail ? undefined : 'noreferrer'}
      className={className}
      onClick={(ev) => ev.stopPropagation()}
    >
      {children}
    </a>
  );
}
