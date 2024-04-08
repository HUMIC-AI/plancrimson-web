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
  close: () => void;
}

function InfoCardComponent({
  title, headerContent, content, small, noExit, close, isDialog = true,
}: InfoCardProps & { isDialog?: boolean }, ref: React.Ref<HTMLDivElement>) {
  return (
    <div
      className={classNames(
        small ? 'max-w-sm' : 'max-w-lg',
        'my-8 inline-block w-full overflow-hidden rounded-2xl bg-secondary text-left align-middle text-primary shadow-xl transition-all sm:my-16',
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

      {!noExit && (
      <button
        type="button"
        name="Close dialog"
        onClick={() => { console.log('CLICK'); close(); }}
        className="interactive absolute right-5 top-5 rounded-full bg-gray-primary p-2 text-primary"
      >
        <FaTimes />
      </button>
      )}
    </div>
  );
}

export const InfoCard = forwardRef(InfoCardComponent);
