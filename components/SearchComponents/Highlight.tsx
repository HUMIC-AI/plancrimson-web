/* eslint-disable react/no-array-index-key */
import { connectHighlight } from 'react-instantsearch-dom';

const Highlight = connectHighlight(({ highlight, attribute, hit }) => {
  const parsedHit = highlight({
    highlightProperty: '_highlightResult',
    attribute,
    hit,
  });

  return (
    <span>
      {parsedHit.map((part, i) => (part.isHighlighted ? (
        <mark key={i}>{part.value}</mark>
      ) : (
        <span key={i}>{part.value}</span>
      )))}
    </span>
  );
});

export default Highlight;
