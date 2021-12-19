/* eslint-disable no-await-in-loop */
import { NextApiHandler } from 'next';
import searchMyHarvard from 'src/server';
import { getAuth } from 'firebase-admin/auth';
import getAllEvaluations, { getDescriptionText } from '../../src/evaluation';

const handler: NextApiHandler = async (req, res) => {
  const authToken = req.headers.authorization;
  if (!authToken || !authToken.startsWith('Bearer')) {
    res.status(401).json({ error: 'Not verified' });
    return;
  }
  const verify = await getAuth().verifyIdToken(authToken.split(' ')[1]);
  const user = await getAuth().getUser(verify.uid);
  if (!user.customClaims?.admin) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  const {
    search, facets, searchQuery, pageNumber = 1, maxPages,
  } = req.body;

  const allResults = [];
  for (let i = pageNumber; maxPages ? i < pageNumber + maxPages : true; i += 1) {
    const data = await searchMyHarvard({
      search, facets, searchQuery, pageNumber: i,
    });
    const results = await Promise.all(data[0].ResultsCollection.map(async (course) => {
      const evals = await getAllEvaluations(course.ACAD_CAREER, course.SUBJECT + course.CATALOG_NBR);
      return { ...course, textDescription: getDescriptionText(course), evals };
    }));
    allResults.push(...results);
    if (data[2].HitCount === data[2].ResultEnd) break;
  }

  res.json(allResults);
};

export default handler;
