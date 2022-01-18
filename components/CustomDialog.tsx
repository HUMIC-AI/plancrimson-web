import { Dialog, Transition } from '@headlessui/react';
import React, { Fragment } from 'react';
import { FaTimes } from 'react-icons/fa';

type CustomDialogProps = {
  open: boolean;
  closeModal: () => void;
  title: string;
  headerContent?: React.ReactNode;
};

/**
 * Based on https://headlessui.dev/react/dialog
 */
export default function CustomDialog({
  open,
  closeModal,
  title,
  children,
  headerContent,
}: React.PropsWithChildren<CustomDialogProps>) {
  return (
    <Transition appear show={open} as={Fragment}>
      <Dialog
        as="div"
        className="fixed inset-0 z-40 overflow-y-auto"
        onClose={closeModal}
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
            <Dialog.Overlay className="fixed inset-0 bg-white bg-opacity-50" />
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
            <div className="inline-block w-full max-w-lg my-8 overflow-hidden text-left align-middle transition-all transform bg-gray-800 shadow-xl rounded-2xl">
              <div className="p-6 text-white border-none">
                <Dialog.Title as="h3" className="text-xl font-semibold">
                  {title}
                </Dialog.Title>

                {headerContent}
              </div>

              {children}

              <button
                type="button"
                name="Close dialog"
                onClick={closeModal}
                className="absolute top-5 right-5 text-gray-800 rounded-full p-2 bg-white hover:opacity-50 transition-opacity"
              >
                <FaTimes />
              </button>
            </div>
          </Transition.Child>
        </div>
      </Dialog>
    </Transition>
  );
}
