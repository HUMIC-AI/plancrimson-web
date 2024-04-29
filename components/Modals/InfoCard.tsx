import { Dialog } from '@headlessui/react';
import { FaTimes } from 'react-icons/fa';
import { ReactNode, forwardRef } from 'react';

interface ContentProps {
  title?: string;
  headerContent?: ReactNode;
  content?: ReactNode;
}

// arguments for card itself
export interface InfoCardProps extends ContentProps {
  close?: () => void;
  isDialog?: boolean;
}

// arguments for displaying modal
export interface ModalProps extends ContentProps {
  close: 'back' | 'none' | (() => void)
}

/**
 * A card that displays information. Used in the {@link CustomModal}.
 * Shows a close button if close is undefined.
 */
export const InfoCard = forwardRef(({
  title, headerContent, content, close, isDialog = true,
}: InfoCardProps, ref: React.Ref<HTMLDivElement>) => (
  <div
    className="primary w-full rounded-xl text-left lg:rounded-2xl"
    ref={ref}
  >
    <div className="border-none p-6">
      {isDialog ? (
        <Dialog.Title as="h3" className="text-xl font-bold">
          {title}
        </Dialog.Title>
      ) : (
        <h3 className="text-xl font-bold">
          {title}
        </h3>
      )}

      {headerContent}
    </div>

    {content}

    {close && (
      <button
        type="button"
        name="Close dialog"
        onClick={close}
        className="interactive secondary absolute right-5 top-5 rounded-full p-2"
      >
        <FaTimes />
      </button>
    )}
  </div>
));

