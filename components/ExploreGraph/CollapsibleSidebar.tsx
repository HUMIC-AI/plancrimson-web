import { Disclosure } from '@headlessui/react';
import { forwardRef, PropsWithChildren, Ref } from 'react';
import { FaAngleDoubleRight, FaAngleDoubleLeft } from 'react-icons/fa';
import { getAnalytics, logEvent } from 'firebase/analytics';
import Link from 'next/link';
import { classNames } from '../../src/utils/styles';
import { ExploreGraphButtons } from './ExploreGraphButtons';
import { useGraphContext } from '../../src/context/GraphProvider';

export const SidebarPanel = forwardRef(({
  children, side, defaultOpen, showLink = false,
}: PropsWithChildren<{
  side: 'left' | 'right';
  defaultOpen?: boolean;
  showLink?: boolean
}>, ref: Ref<HTMLElement>) => {
  const { graph, phase, subjects } = useGraphContext();
  return (
    <Disclosure ref={ref} defaultOpen={defaultOpen}>
      {({ open }) => (
        <div className={classNames(
          // 4rem is the height of the header
          'absolute top-16 w-full',
          'transition-transform duration-200',
          side === 'left' ? 'left-0 max-w-[14rem]' : 'right-0 max-w-xs md:max-w-sm',
          open
            ? (side === 'left' ? 'translate-x-4' : '-translate-x-4')
            : (side === 'left' ? '-translate-x-full' : 'translate-x-full'),
        )}
        >
          <Disclosure.Panel
            static
            className="max-h-[calc(100vh-4rem)] overflow-auto"
          >
            {children}
          </Disclosure.Panel>

          <div className={classNames(
            'absolute top-6 flex items-stretch space-x-2',
            side === 'left' ? 'left-full ml-4' : 'right-full mr-4',
          )}
          >
            <Disclosure.Button
              className={classNames(
                // 13px makes it match up with the search bar menu button
                'secondary rounded p-[0.5625rem]',
                'interactive duration-200',
                open && 'rotate-180',
              )}
              onClick={() => {
                logEvent(getAnalytics(), 'toggle_sidebar', { side, open: !open });
              }}
            >
              {side === 'left' ? <FaAngleDoubleRight /> : <FaAngleDoubleLeft />}
            </Disclosure.Button>
            {showLink && side === 'left' && <Link href="/explore/game" className="secondary interactive flex items-center rounded px-2 font-medium">Play</Link>}
          </div>

          {side === 'right' && graph && <ExploreGraphButtons graph={graph} phase={phase} subjects={subjects} />}
        </div>
      )}
    </Disclosure>
  );
});
