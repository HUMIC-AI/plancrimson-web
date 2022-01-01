import { MeiliSearch } from 'meilisearch';
import { ExtendedClass } from '../shared/apiTypes';
import { getMeiliApiKey, getMeiliHost } from '../shared/util';

const ClassIndex = new MeiliSearch({
  host: getMeiliHost(),
  apiKey: getMeiliApiKey(),
}).index<ExtendedClass>('courses');

export default ClassIndex;
