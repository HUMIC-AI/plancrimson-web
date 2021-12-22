// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiHandler } from 'next';
import {
  Class, ExtendedClass, Facet, SearchProperties, SearchResults,
} from 'src/types';
import searchMyHarvard from 'server/server';
import { extendClass } from 'server/evaluation';
import { getAuth } from 'firebase-admin/auth';
import ClassIndex from '../../shared/meilisearch';

type ResponseData = SearchResults | {
  error?: string
};

const handler: NextApiHandler<ResponseData> = async (req, res) => {
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
    [{ ResultsCollection: rawResults }, { Facets: resultFacets }, searchProperties] = await searchMyHarvard({
      search, searchQuery, facets, pageNumber,
    });
  } catch (err: any) {
    res.status(500).json({ error: `Error searching my.harvard: ${err.message}` });
    return;
  }

  const classes = await Promise.allSettled(rawResults.map((course) => extendClass(course, includeEvals || updateDb)));

  if (classes.find((result) => result.status === 'rejected')) {
    res.status(500).json({
      error: `Failed fetching evaluations: ${classes
        .map((result) => (result.status === 'rejected' ? result.reason : null))
        .filter((val) => val !== null)
        .join('; ')}`,
    });
    return;
  }

  const successfulClasses = classes
    .map((result) => (result.status === 'fulfilled' ? result.value : null))
    .filter((val) => val !== null) as ExtendedClass[];

  if (updateDb) {
    const token = req.headers.authorization;
    if (!token || !token.startsWith('Bearer')) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    const verify = await getAuth().verifyIdToken(token.split(' ')[1]);
    const user = await getAuth().getUser(verify.uid);
    if (user.customClaims?.admin) {
      await ClassIndex.addDocuments(successfulClasses);
      console.log('added documents', JSON.stringify(classes).slice(0, 500));
    } else {
      res.status(401).json({ error: 'Must be an administrator to update' });
      return;
    }
  }

  res.json({ classes: successfulClasses, facets: resultFacets, searchProperties });
};

export default handler;
