/// <reference types="@welldone-software/why-did-you-render" />
import React from 'react';
import { isDevelopment } from './utils/utils';

if (isDevelopment) {
  if (typeof window !== 'undefined') {
    // eslint-disable-next-line global-require
    const wdyr = require('@welldone-software/why-did-you-render');
    wdyr(React, {
      trackAllPureComponents: true,
    });
  }
}
