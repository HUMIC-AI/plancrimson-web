/// <reference types="@welldone-software/why-did-you-render" />
import React from 'react';

if (process.env.NODE_ENV === 'development') {
  if (typeof window !== 'undefined') {
    // eslint-disable-next-line import/no-extraneous-dependencies, global-require
    const wdyr = require('@welldone-software/why-did-you-render');
    wdyr(React, {
      trackAllPureComponents: true,
    });
  }
}
