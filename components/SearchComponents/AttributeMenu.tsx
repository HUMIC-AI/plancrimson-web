import { FaAngleDoubleLeft } from 'react-icons/fa';
import { adjustAttr } from '../../shared/util';
import { useAppDispatch } from '../../src/app/hooks';
import { setShowAttributes } from '../../src/features/semesterFormat';
import { useLgBreakpoint } from '../../src/hooks';
import Attribute from './Attribute';
import MEILI_ATTRIBUTES from '../../shared/meiliAttributes.json';

/**
 * Renders the list of attributes to filter classes by.
 */
export default function AttributeMenu() {
  const dispatch = useAppDispatch();
  const isLg = useLgBreakpoint();

  return (
    <div className="flex-shrink-0 self-start w-64 p-2 hidden lg:flex flex-col space-y-2 from-gray-800 to-blue-900 bg-gradient-to-br rounded-md">
      <h1 className="font-semibold text-white text-xl text-center relative">
        Filters
        <button
          type="button"
          className="absolute inset-y-0 right-0 interactive"
          onClick={() => dispatch(setShowAttributes(false))}
        >
          <FaAngleDoubleLeft />
        </button>
      </h1>
      {isLg && MEILI_ATTRIBUTES.filterableAttributes.map((attr) => (
        <Attribute attribute={attr} key={attr} label={adjustAttr(attr)} />
      ))}
      <span className="text-white text-xs p-1">
        If filters are not showing up, clear your search and try again.
      </span>
    </div>
  );
}
