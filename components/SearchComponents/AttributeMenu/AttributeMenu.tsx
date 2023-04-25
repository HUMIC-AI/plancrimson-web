import { meiliAttributes, adjustAttr } from '@/src/lib';
import { FaChevronLeft } from 'react-icons/fa';
import { useAppDispatch } from '@/src/utils/hooks';
import { Planner } from '@/src/features';
import { breakpoints, classNames, useBreakpoint } from '@/src/utils/styles';
import Attribute from './Attribute';

interface Props {
  lgOnly?: boolean;
  withWrapper?: boolean;
  showSubjectColor?: boolean;
}

/**
 * Renders the list of attributes to filter classes by.
 */
export default function AttributeMenu({ lgOnly, withWrapper, showSubjectColor = false }: Props) {
  const dispatch = useAppDispatch();
  const isLg = useBreakpoint(breakpoints.lg);

  return (
    <div className={classNames(
      'w-64 p-2 flex flex-col space-y-2 rounded-md overflow-auto min-w-min sticky top-8',
      lgOnly ? 'hidden lg:block' : false,
      withWrapper ? 'flex-shrink-0 self-start' : false,
    )}
    >
      <button
        className="relative w-full rounded-md transition-colors hover:bg-gray-dark/50"
        type="button"
        onClick={() => dispatch(Planner.setShowAttributes(false))}
      >
        <h2>
          Filters
        </h2>

        <span className="absolute right-2 top-1/2 -translate-y-1/2">
          <span className="sr-only">Close</span>
          <FaChevronLeft size={16} />
        </span>
      </button>

      {(!lgOnly || isLg) && meiliAttributes.filterableAttributes.map((attr) => (
        <Attribute
          attribute={attr}
          key={attr}
          label={adjustAttr(attr)}
          showSubjectColor={showSubjectColor}
        />
      ))}

      <p className="p-1 text-sm">
        If filters are not showing up, clear your search and try again.
      </p>
    </div>
  );
}
