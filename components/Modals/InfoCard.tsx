import { Dialog } from '@headlessui/react';
import { FaTimes } from 'react-icons/fa';
import { ReactNode, forwardRef } from 'react';

export interface InfoCardProps {
  title?: string;
  headerContent?: ReactNode;
  content?: ReactNode;
  noExit?: boolean;
  close?: () => void;
}

function InfoCardComponent({
  title, headerContent, content, noExit, close, isDialog = true,
}: InfoCardProps & { isDialog?: boolean }, ref: React.Ref<HTMLDivElement>) {
  return (
    <div
      // className="primary w-full rounded-xl text-left shadow-xl transition-all lg:rounded-2xl"
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

      {!noExit && close && (
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
  );
}

export const InfoCard = forwardRef(InfoCardComponent);
