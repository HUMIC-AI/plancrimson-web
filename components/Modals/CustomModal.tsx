import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import { useModal } from '@/src/context/modal';
import { InfoCard } from './InfoCard';

/**
 * Based on https://headlessui.dev/react/dialog
 * Only one instance exists in the root Layout component.
 * It gets controlled by the {@link ModalContext} in {@link src/context/modal.tsx}.
 * This does NOT get access to a MeiliSearch instance by default. One must be provided.
 */
export default function CustomModal() {
  const { open, setOpen, modalProps: data } = useModal();

  const close = () => {
    console.info('closing modal');
    if (data?.noExit) return;
    if (data?.close) data.close();
    else setOpen(false);
  };

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

          {/* This element and the inline-block below tricks the browser into centering the modal contents. */}
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
            {/* <div className="mx-auto my-8 inline-block max-w-sm overflow-hidden align-middle sm:my-16 md:max-w-lg"> */}
            <div className="my-8 inline-block w-full max-w-sm overflow-hidden align-middle shadow-xl transition-all sm:my-16 lg:max-w-lg">
              <InfoCard {...data} close={close} />
            </div>
          </Transition.Child>
        </div>
      </Dialog>
    </Transition>
  );
}

