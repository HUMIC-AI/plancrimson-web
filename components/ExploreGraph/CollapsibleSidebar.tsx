import { forwardRef, PropsWithChildren, Ref } from 'react';
import { FaAngleDoubleRight, FaAngleDoubleLeft } from 'react-icons/fa';
import { getAnalytics, logEvent } from 'firebase/analytics';
import Link from 'next/link';
import { classNames } from '../../src/utils/styles';
import { ExploreGraphButtons } from './ExploreGraphButtons';
import { GraphPageSubjectsList } from './GraphPageSubjectsList';
import { useGraphContext } from '../../src/context/GraphProvider';

type CollapsibleSidebarProps = {
  side: 'left' | 'right';
  showLink?: boolean
};

export const SidebarPanel = forwardRef(({
  children, side, showLink = false,
}: PropsWithChildren<CollapsibleSidebarProps>, ref: Ref<HTMLDivElement>) => {
  const {
    graph, setShowLeftSidebar, setShowRightSidebar, showLeftSidebar, showRightSidebar,
  } = useGraphContext();
  const open = side === 'left' ? showLeftSidebar : showRightSidebar;
  const setOpen = side === 'left' ? setShowLeftSidebar : setShowRightSidebar;
  return (
    <div
      className={classNames(
      // 4rem is the height of the header
        'absolute top-16 w-full',
        'transition-transform duration-200',
        side === 'left' ? 'left-0 max-w-[14rem]' : 'right-0 max-w-xs md:max-w-sm',
        open
          ? (side === 'left' ? 'translate-x-4' : '-translate-x-4')
          : (side === 'left' ? '-translate-x-full' : 'translate-x-full'),
      )}
      ref={ref}
    >
      <div className="max-h-[calc(100vh-4rem)] overflow-auto">
        {children}
      </div>

      <div className={classNames(
        'absolute top-6 flex items-stretch space-x-2',
        side === 'left' ? 'left-full ml-4' : 'right-full mr-4',
      )}
      >
        <button
          type="button"
        // 13px makes it match up with the search bar menu button
          className="secondary interactive flex items-center rounded px-[0.5625rem]"
          onClick={() => {
            logEvent(getAnalytics(), 'toggle_sidebar', { side, open: !open });
            setOpen(!open);
          }}
        >
          {side === 'right' && !open && (
          <span className="mr-2 whitespace-nowrap font-medium">
            Course Info
          </span>
          )}

          <span className={classNames(open && 'rotate-180', 'py-[0.5625rem]')}>
            {side === 'left' ? (
              <FaAngleDoubleRight />
            ) : (
              <FaAngleDoubleLeft />
            )}
          </span>

          {side === 'left' && !open && (
          <span className="ml-2 whitespace-nowrap font-medium">
            {graph?.target ? `Target course: ${graph.target.subject}${graph.target.catalog}` : 'Search courses'}
          </span>
          )}
        </button>

        {showLink && side === 'left' && (
        <Link href="/explore/game" className="secondary interactive flex items-center rounded px-2 font-medium">
          Play
        </Link>
        )}

        {side === 'right' && <ExploreGraphButtons />}
      </div>

      {side === 'left' && <GraphPageSubjectsList />}
    </div>
  );
});


