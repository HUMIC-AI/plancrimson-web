import { FaAngleDoubleLeft } from 'react-icons/fa';
import { adjustAttr, breakpoints, classNames } from '../../shared/util';
import { useAppDispatch, useBreakpoint } from '../../src/hooks';
import Attribute from './Attribute';
import MEILI_ATTRIBUTES from '../../shared/meiliAttributes.json';
import { Planner } from '../../src/features';

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
      'w-64 p-2 flex flex-col space-y-2 from-gray-800 to-blue-900 bg-gradient-to-br rounded-md overflow-auto min-w-min',
      lgOnly ? 'hidden lg:block' : false,
      withWrapper ? 'flex-shrink-0 self-start' : false,
    )}
    >
      <h1 className="font-semibold text-white text-xl text-center relative">
        Filters
        <button
          type="button"
          className="absolute inset-y-0 right-0 interactive"
          onClick={() => dispatch(Planner.setShowAttributes(false))}
        >
          <FaAngleDoubleLeft />
        </button>
      </h1>
      {(!lgOnly || isLg) && MEILI_ATTRIBUTES.filterableAttributes.map((attr) => (
        <Attribute attribute={attr} key={attr} label={adjustAttr(attr)} showSubjectColor={showSubjectColor} />
      ))}
      <span className="text-white text-xs p-1">
        If filters are not showing up, clear your search and try again.
      </span>
    </div>
  );
}
