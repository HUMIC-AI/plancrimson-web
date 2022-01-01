import { connectStats } from 'react-instantsearch-dom';

const Stats = connectStats(({
  nbHits, processingTimeMS,
}) => (
  <div>
    <p>
      Time:
      {' '}
      {processingTimeMS}
      {' '}
      ms
    </p>
    <p>
      {nbHits}
      {' '}
      classes found
    </p>
  </div>
));

export default Stats;
