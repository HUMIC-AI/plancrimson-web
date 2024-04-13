import { FaTimes } from 'react-icons/fa';
import { classNames } from '../../src/utils/styles';

export function GridButtons({
  title,
  items,
  showRemove = false,
}: {
  title: string;
  items: { label: string; selected: boolean; onClick: () => void }[];
  showRemove?: boolean;
}) {
  return (
    <>
      {' '}
      <h4 className="w-min md:whitespace-nowrap">
        {title}
        :
      </h4>

      <ul className="flex h-min flex-wrap items-center">
        {items.map(({ label, selected, onClick }) => (
          <li key={label} className="contents">
            <button
              type="button"
              name={label}
              className={classNames(
                selected ? 'bg-blue-secondary/80' : 'bg-secondary/80',
                'button border-gray-primary/5 flex items-center space-x-2',
              )}
              onClick={onClick}
            >
              <span>
                {label}
              </span>

              {showRemove && <FaTimes />}
            </button>
          </li>
        ))}
      </ul>
    </>
  );
}
