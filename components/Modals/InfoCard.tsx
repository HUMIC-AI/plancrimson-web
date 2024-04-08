import { Dialog } from '@headlessui/react';
import { FaTimes } from 'react-icons/fa';
import { classNames } from '@/src/utils/styles';
import { ReactNode, forwardRef } from 'react';

export interface InfoCardProps {
  title?: string;
  headerContent?: ReactNode;
  content?: ReactNode;
  small?: boolean;
  noExit?: boolean;
  close?: () => void;
}

function InfoCardComponent({
  title, headerContent, content, small, noExit, close, isDialog = true,
}: InfoCardProps & { isDialog?: boolean }, ref: React.Ref<HTMLDivElement>) {
  return (
    <div
      className={classNames(
        small ? 'max-w-sm rounded-xl' : 'max-w-lg rounded-2xl',
        isDialog ? 'my-8 sm:my-16 inline-block align-middle overflow-hidden' : 'overflow-auto',
        'w-full text-left primary shadow-xl transition-all',
      )}
      ref={ref}
    >
      <div className="border-none p-6 text-primary">
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

      {!noExit && close && (
      <button
        type="button"
        name="Close dialog"
        onClick={close}
        className="interactive absolute right-5 top-5 rounded-full bg-gray-primary p-2 text-primary"
      >
        <FaTimes />
      </button>
      )}
    </div>
  );
}

export const InfoCard = forwardRef(InfoCardComponent);
