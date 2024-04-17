import { Disclosure } from '@headlessui/react';
import { forwardRef, PropsWithChildren, Ref } from 'react';
import { FaAngleDoubleRight, FaAngleDoubleLeft } from 'react-icons/fa';
import { getAnalytics, logEvent } from 'firebase/analytics';
import { classNames } from '../../src/utils/styles';

export const SidebarPanel = forwardRef(({ children, side, defaultOpen }: PropsWithChildren<{ side: 'left' | 'right', defaultOpen?: boolean }>, ref: Ref<HTMLElement>) => (
  <Disclosure ref={ref} defaultOpen={defaultOpen}>
    {({ open }) => (
      <div className={classNames(
        // 4rem is the height of the header
        'absolute top-16 w-full',
        'transition-transform duration-200',
        side === 'left' ? 'left-0 max-w-[12rem] xl:max-w-xs' : 'right-0 max-w-xs md:max-w-sm',
        open
          ? (side === 'left' ? 'translate-x-4' : '-translate-x-4')
          : (side === 'left' ? '-translate-x-full' : 'translate-x-full'),
      )}
      >
        <Disclosure.Panel
          unmount={false}
          className="max-h-[calc(100vh-4rem)] overflow-auto"
        >
          {children}
        </Disclosure.Panel>

        <Disclosure.Button
          className={classNames(
            // 13px makes it match up with the search bar menu button
            'secondary absolute top-6 rounded p-[0.6875rem]',
            'interactive duration-200',
            open && 'rotate-180',
            side === 'left' ? 'left-full ml-4' : 'right-full mr-4',
          )}
          onClick={() => {
            logEvent(getAnalytics(), 'toggle_sidebar', { side, open: !open });
          }}
        >
          {side === 'left' ? <FaAngleDoubleRight /> : <FaAngleDoubleLeft />}
        </Disclosure.Button>
      </div>
    )}
  </Disclosure>
));
