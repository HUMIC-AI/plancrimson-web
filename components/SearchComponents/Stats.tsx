import { connectStats } from 'react-instantsearch-dom';

const Stats = connectStats(({
  nbHits, processingTimeMS,
}) => (
  <div>
    <span>
      Time:
      {' '}
      {processingTimeMS}
      {' '}
      ms
    </span>
    <span className="ml-2">
      {nbHits}
      {' '}
      classes found
    </span>
  </div>
));

export default Stats;
