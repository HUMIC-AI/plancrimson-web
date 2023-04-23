/* eslint-disable react/no-array-index-key */
import { connectHighlight } from 'react-instantsearch-dom';
import type { HighlightProps } from 'react-instantsearch-core';
import ClientOrDemo from './ClientOrDemo';

function Highlight({ highlight, attribute, hit }: HighlightProps) {
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
}

export default function (props: Pick<HighlightProps, 'hit' | 'attribute'>) {
  return <ClientOrDemo connector={connectHighlight} component={Highlight} extraProps={props} />;
}
