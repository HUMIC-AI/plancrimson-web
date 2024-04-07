import { Transition } from '@headlessui/react';
import React, { Fragment, PropsWithChildren } from 'react';

type Props = {
  show?: boolean;
  unmount?: boolean;
  appear?: boolean;
  afterEnter?: () => void;
  beforeEnter?: () => void;
  afterLeave?: () => void;
};

export default function FadeTransition({
  children,
  show,
  unmount,
  appear,
  beforeEnter,
  afterEnter,
  afterLeave,
}: PropsWithChildren<Props>) {
  return (
    <Transition
      as={Fragment}
      enter="transition-opacity duration-200 ease-in-out"
      enterFrom="opacity-0"
      enterTo="opacity-100"
      leave="transition-opacity duration-200 ease-in-out"
      leaveFrom="opacity-100"
      leaveTo="opacity-0"
      show={show}
      unmount={unmount}
      appear={appear}
      afterEnter={afterEnter}
      beforeEnter={beforeEnter}
      afterLeave={afterLeave}
    >
      {children}
    </Transition>
  );
}
