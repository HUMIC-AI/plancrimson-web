import { connectSortBy } from 'react-instantsearch-dom';

const SortBy = connectSortBy(({ items, refine, createURL }) => (
  <ul>
    {items.map((item: { value: string; label: string; isRefined: boolean; }) => (
      <li key={item.value}>
        <a
          href={createURL(item.value)}
          style={{ fontWeight: item.isRefined ? 'bold' : '' }}
          onClick={(event) => {
            event.preventDefault();
            refine(item.value);
          }}
        >
          {item.label}
        </a>
      </li>
    ))}
  </ul>
));

export default SortBy;
