import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import { useModal } from '@/src/context/modal';
import { InfoCard } from './InfoCard';

/**
 * Based on https://headlessui.dev/react/dialog
 * Only one instance exists in the root Layout component.
 * It gets controlled by the ModalContext in src/context/modal.tsx.
 * This does NOT get access to a MeiliSearch instance by default. One must be provided.
 */
export default function CustomModal() {
  const { open, setOpen, data } = useModal();

  const close = () => !data?.noExit && (data?.close ? data.close() : setOpen(false));

  return (
    <Transition appear show={open} as={Fragment}>
      <Dialog
        as="div"
        className="fixed inset-0 z-10 overflow-y-auto"
        onClose={close}
      >
        <div className="min-h-screen px-4 text-center">
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <Dialog.Overlay className="fixed inset-0 bg-black/50" />
          </Transition.Child>

          {/* This element is to trick the browser into centering the modal contents. */}
          <span
            className="inline-block h-screen align-middle"
            aria-hidden="true"
          >
            &#8203;
          </span>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0 scale-95"
            enterTo="opacity-100 scale-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100 scale-100"
            leaveTo="opacity-0 scale-95"
          >
            <InfoCard {...data} />
          </Transition.Child>
        </div>
      </Dialog>
    </Transition>
  );
}

