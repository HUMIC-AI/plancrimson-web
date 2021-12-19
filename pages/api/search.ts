// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiHandler } from 'next';
import searchMyHarvard from '../../src/server';
import { MyHarvardResponse } from '../../src/types';

type ResponseData = MyHarvardResponse | {
  error?: string
};

const handler: NextApiHandler<ResponseData> = async (req, res) => {
  const {
    search, facets, pageNumber, searchQuery,
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
    const data = await searchMyHarvard({
      search, searchQuery, facets, pageNumber,
    });
    res.json(data);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
};

export default handler;
