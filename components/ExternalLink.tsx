import React from 'react';

type Props = {
  href: string;
};

const ExternalLink: React.FC<Props> = function ({ href, children }) {
  return (
    <a href={href} target="_blank" rel="noreferrer" className="font-bold hover:opacity-50 transition-opacity" onClick={(ev) => ev.stopPropagation()}>
      {children}
    </a>
  );
};

export default ExternalLink;
