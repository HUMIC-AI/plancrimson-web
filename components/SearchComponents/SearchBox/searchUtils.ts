import type { IndexName } from '../../../src/lib';

export const alertSignIn = () => alert('Sign in to search for courses!');

export const SORT_INDEXES = (indexName: IndexName) => [
  { label: 'Relevant', value: indexName },
  {
    label: 'Catalog number',
    value: `${indexName}:CATALOG_NBR:asc`,
  },
  {
    label: 'Popularity',
    value: `${indexName}:meanClassSize:desc`,
  },
  {
    label: 'Light Workload',
    value: `${indexName}:meanHours:asc`,
  },
  {
    label: 'Highly Recommended',
    value: `${indexName}:meanRecommendation:desc`,
  },
  {
    label: 'Highly Rated',
    value: `${indexName}:meanRating:desc`,
  },
] as const;
