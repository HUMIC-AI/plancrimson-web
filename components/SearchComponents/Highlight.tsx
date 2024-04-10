import { connectHighlight } from 'react-instantsearch-dom';
import type { HighlightProps } from 'react-instantsearch-core';
import useClientOrDemo from './ClientOrDemo';

type Provided = Pick<HighlightProps, 'highlight'>;

type Exposed = Pick<HighlightProps, 'hit' | 'attribute'>;

type Props = Provided & Exposed;

function Highlight({
  highlight, attribute, hit,
}: Props) {
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

export default function (props: Exposed) {
  const Component = useClientOrDemo<Provided, Exposed>(
    connectHighlight as any,
    Highlight,
  );
  return <Component {...props} />;
}
