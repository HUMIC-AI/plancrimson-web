import { MeiliSearch } from 'meilisearch';
import { Class } from 'src/types';

const ClassIndex = new MeiliSearch({
  host: 'http://127.0.0.1:7700',
}).index<Class>('courses');

export default ClassIndex;
