import { connectSortBy } from 'react-instantsearch-dom';
import { classNames } from '../../shared/util';

type Item = { value: string; label: string; isRefined: string; };

const SortBy = connectSortBy(({ items, refine }) => (
  <div className="flex flex-wrap items-center gap-2">
    <h3 className="font-medium">Sort by:</h3>
    <ul className="contents">
      {items.map((item: Item) => (
        <li key={item.value} className="contents">
          <button
            type="button"
            className={classNames(
              item.isRefined && 'font-bold',
              'shadow rounded py-1 px-2 hover-blue text-sm min-w-min',
            )}
            onClick={(event) => {
              event.preventDefault();
              refine(item.value);
            }}
          >
            {item.label}
          </button>
        </li>
      ))}
    </ul>
  </div>
));

export default SortBy;
