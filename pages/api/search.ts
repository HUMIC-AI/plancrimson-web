// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiHandler } from 'next';
import { SearchResults } from 'src/types';
import searchMyHarvard from 'server/server';
import getAllEvaluations, { getDescriptionText } from 'src/evaluation';

type ResponseData = SearchResults | {
  error?: string
};

const handler: NextApiHandler<ResponseData> = async (req, res) => {
  const {
    search, facets, pageNumber, searchQuery, includeEvals,
  } = req.body;

  if (typeof search !== 'string') {
    res.status(400).json({ error: 'Must specify a search via query parameters' });
    return;
  }
  if (typeof facets !== 'undefined' && !Array.isArray(facets)) {
    res.status(400).json({ error: 'Facets must be an array' });
    return;
  }

  try {
    const [{ ResultsCollection: rawResults }, { Facets: resultFacets }, searchProperties] = await searchMyHarvard({
      search, searchQuery, facets, pageNumber,
    });

    const classes = await Promise.all(rawResults.map(async (course): Promise<ExtendedClass> => {
      if (includeEvals) {
        const evals = await getAllEvaluations(course.ACAD_CAREER, course.SUBJECT + course.CATALOG_NBR);
        return { ...course, textDescription: getDescriptionText(course), evals };
      }
      return { ...course, textDescription: getDescriptionText(course) };
    }));

    res.json({ classes, facets: resultFacets, searchProperties });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
};

export default handler;
