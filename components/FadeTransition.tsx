import { Transition } from '@headlessui/react';
import React, { Fragment } from 'react';

const FadeTransition: React.FC = function ({ children }) {
  return (
    <Transition
      enter="transition-opacity duration-100 ease-out"
      enterFrom="opacity-0"
      enterTo="opacity-100"
      leave="transition-opacity duration-100 ease-in"
      leaveFrom="opacity-100"
      leaveTo="opacity-0"
      as={Fragment}
    >
      {children}
    </Transition>
  );
};

export default FadeTransition;
