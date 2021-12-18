import React from 'react';

const DownloadLink: React.FC<{ obj: any, filename: string }> = function ({ obj, filename, children }) {
  return (
    <a
      href={`data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(obj, null, 2))}`}
      download={`${filename}.json`}
    >
      {children}
    </a>
  );
};

export default DownloadLink;
