import React from 'react';

type Props = {
  href: string;
};

const ExternalLink: React.FC<React.PropsWithChildren<Props>> = function ({ href, children }) {
  const isMail = href.startsWith('mailto');
  return (
    // eslint-disable-next-line react/jsx-no-target-blank
    <a
      href={href}
      target={isMail ? undefined : '_blank'}
      rel={isMail ? undefined : 'noreferrer'}
      className="interactive font-bold"
      onClick={(ev) => ev.stopPropagation()}
    >
      {children}
    </a>
  );
};

export default ExternalLink;
