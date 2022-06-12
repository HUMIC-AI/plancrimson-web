import { MeiliSearch } from 'meilisearch';
import { ExtendedClass } from '../shared/apiTypes';
import { getMeiliHost } from '../src/meili';

const ClassIndex = new MeiliSearch({
  host: getMeiliHost(),
  apiKey: process.env.MEILI_PRIVATE,
}).index<ExtendedClass>('courses');

export default ClassIndex;
