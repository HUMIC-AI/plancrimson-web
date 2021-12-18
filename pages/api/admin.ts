/* eslint-disable no-await-in-loop */
import { NextApiHandler } from 'next';
import searchMyHarvard from 'src/server';
import { getAuth } from 'firebase-admin/auth';
import getAllEvaluations from '../../src/evaluation';

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
    search, facets, searchQuery, startPage = 1, maxPages,
  } = req.body;

  const allResults = [];
  for (let pageNumber = startPage; maxPages ? pageNumber < startPage + maxPages : true; pageNumber += 1) {
    const data = await searchMyHarvard({
      search, facets, searchQuery, pageNumber,
    });
    const results = await Promise.all(data[0].ResultsCollection.map(async (course) => {
      const evals = await getAllEvaluations(course.ACAD_CAREER, course.SUBJECT + course.CATALOG_NBR);
      return { course, evals };
    }));
    allResults.push(results);
    if (data[2].HitCount === data[2].ResultEnd) break;
  }

  res.json(allResults);
};

export default handler;
