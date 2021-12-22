import { MeiliSearch } from 'meilisearch';
import { ExtendedClass } from 'src/types';

const ClassIndex = new MeiliSearch({
  host: 'http://127.0.0.1:7700',
}).index<ExtendedClass>('courses');

export default ClassIndex;
