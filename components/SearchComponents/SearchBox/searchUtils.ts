export const alertSignIn = () => alert('Sign in to search for courses!');

export const SORT_INDEXES = [
  { label: 'Relevant', value: 'courses' },
  {
    label: 'Catalog number',
    value: 'courses:CATALOG_NBR:asc',
  },
  {
    label: 'Popularity',
    value: 'courses:meanClassSize:desc',
  },
  {
    label: 'Light Workload',
    value: 'courses:meanHours:asc',
  },
  {
    label: 'Highly Recommended',
    value: 'courses:meanRecommendation:desc',
  },
  {
    label: 'Highly Rated',
    value: 'courses:meanRating:desc',
  },
];
