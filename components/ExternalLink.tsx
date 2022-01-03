import React from 'react';

type Props = {
  href: string;
};

const ExternalLink: React.FC<Props> = function ({ href, children }) {
  const isMail = href.startsWith('mailto');
  return (
    // eslint-disable-next-line react/jsx-no-target-blank
    <a
      href={href}
      target={isMail ? undefined : '_blank'}
      rel={isMail ? undefined : 'noreferrer'}
      className="font-bold hover:opacity-50 transition-opacity"
      onClick={(ev) => ev.stopPropagation()}
    >
      {children}
    </a>
  );
};

export default ExternalLink;
