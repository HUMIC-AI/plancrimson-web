// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiHandler } from 'next';
import searchMyHarvard, { verifyIdToken } from 'server/server';
import { extendClass } from 'server/evaluation';
import ClassIndex from '../../shared/meilisearch';
import type {
  Class, ExtendedClass, Facet, FailedClasses, SearchProperties, SearchResults,
} from '../../shared/apiTypes';
import { FetchError } from '../../shared/fetcher';
import { getClassId } from '../../src/util';

const handler: NextApiHandler<SearchResults> = async (req, res) => {
  const {
    search, facets, pageNumber, searchQuery, includeEvals = false, updateDb = false,
  } = req.body;

  if (typeof search !== 'string') {
    res.status(400).json({ error: 'Must specify a search via query parameters' });
    return;
  }
  if (typeof facets !== 'undefined' && !Array.isArray(facets)) {
    res.status(400).json({ error: 'Facets must be an array' });
    return;
  }

  let rawResults: Class[];
  let resultFacets: Facet[];
  let searchProperties: SearchProperties;

  try {
    [
      { ResultsCollection: rawResults },
      { Facets: resultFacets },
      searchProperties,
    ] = await searchMyHarvard({
      search, searchQuery, facets, pageNumber,
    });
  } catch (err: any) {
    res.status(500).json({ error: `Error searching my.harvard: ${err.message}` });
    return;
  }

  // the search was successful; now fetch additional data (text description and evaluations)
  // for the returned classes

  const classes = await Promise.allSettled(rawResults.map(
    (cls) => extendClass(cls, includeEvals || updateDb),
  ));

  const failedClasses: FailedClasses = {};

  const extendedClasses = classes
    .map((result) => {
      if (result.status === 'fulfilled') {
        return result.value;
      }

      // if the promise threw, the data is included in the error (see extendClass)
      const reason = result.reason as FetchError;
      const error = reason.info.message as string;
      const data = reason.info.data as ExtendedClass;
      failedClasses[getClassId(data)] = { error };
      // still return the class data
      return data;
    }) as ExtendedClass[];

  if (updateDb) {
    // user must be authenticated to modify the database
    const token = req.headers.authorization;
    if (!verifyIdToken(token)) {
      res.status(401).json({ error: 'Must be an administrator to update' });
      return;
    }

    try {
      await ClassIndex.addDocuments(extendedClasses);
      console.log(`added ${extendedClasses.length} documents to MeiliSearch`);
    } catch (err) {
      const { message } = err as Error;
      res.status(500).json({ error: `Could not add documents to MeiliSearch: ${message}` });
      return;
    }
  }

  res.json({
    classes: extendedClasses,
    facets: resultFacets,
    searchProperties,
    failedClasses,
  });
};

export default handler;
