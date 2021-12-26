import { NextApiHandler } from 'next';
import { extendClass } from '../../server/evaluation';
import searchMyHarvard from '../../server/server';
import { ExtendedClass } from '../../shared/apiTypes';
import ClassIndex from '../../shared/meilisearch';

const handler: NextApiHandler<ExtendedClass | { error: string }> = async (req, res) => {
  const { classKey, updateDb } = req.query;

  if (typeof classKey !== 'string') {
    res.status(400).json({ error: 'Invalid request' });
    return;
  }

  try {
    const doc = await ClassIndex.getDocument(classKey);
    res.json(doc);
    return;
  } catch (err) {
    console.log(`missed cache for ${classKey}`);
  }

  const [{ ResultsCollection: [cls] }] = await searchMyHarvard({
    search: `(HU_STRM_CLASSNBR:\\"${classKey}\\")`,
  });

  const extended = await extendClass(cls);

  if (updateDb) ClassIndex.addDocuments([extended]);

  res.json(extended);
};

export default handler;
