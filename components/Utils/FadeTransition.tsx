import { Transition } from '@headlessui/react';
import React, { Fragment } from 'react';

type Props = {
  show?: boolean;
  unmount?: boolean;
  afterEnter?: () => void;
  beforeEnter?: () => void;
  afterLeave?: () => void;
};

const FadeTransition: React.FC<React.PropsWithChildren<Props>> = function ({
  children,
  unmount,
  show,
  beforeEnter,
  afterEnter,
  afterLeave,
}) {
  return (
    <Transition
      enter="transition-opacity duration-200 ease-in-out"
      enterFrom="opacity-0"
      enterTo="opacity-100"
      leave="transition-opacity duration-200 ease-in-out"
      leaveFrom="opacity-100"
      leaveTo="opacity-0"
      afterEnter={afterEnter}
      show={show}
      as={Fragment}
      unmount={unmount}
      beforeEnter={beforeEnter}
      afterLeave={afterLeave}
    >
      {children}
    </Transition>
  );
};

export default FadeTransition;
