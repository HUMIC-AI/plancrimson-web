import { connectHighlight } from 'react-instantsearch-dom';
import type { HighlightProps } from 'react-instantsearch-core';
import useClientOrDemo from './ClientOrDemo';
import useSearchState from '../../src/context/searchState';

type Provided = Pick<HighlightProps, 'highlight'>;

type Exposed = Pick<HighlightProps, 'hit' | 'attribute'>;

type Props = Provided & Exposed;

function HighlightComponent({
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

export function Highlight({ hit, attribute }: Exposed) {
  const { searchState } = useSearchState();

  if (!searchState) return <span>{hit[attribute]}</span>;

  return <HighlightWrapper hit={hit} attribute={attribute} />;
}

function HighlightWrapper(props: Exposed) {
  const Component = useClientOrDemo<Provided, Exposed>(
    connectHighlight as any,
    HighlightComponent,
  );

  return <Component {...props} />;
}
