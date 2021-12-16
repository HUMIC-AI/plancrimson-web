import { NextApiHandler } from 'next';
import getAllEvaluations from '../../src/evaluation';

const handler: NextApiHandler = async (req, res) => {
  const { school, course } = req.query;
  // https://qreports.fas.harvard.edu/home/courses?school=FAS&search=COMPSCI+51
  if (typeof school !== 'string' || typeof course !== 'string') {
    res.status(400).json({ message: 'Please specify both a school and a course in your query' });
    return;
  }

  try {
    const data = await getAllEvaluations(school, course);
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ message: `An error occurred fetching data: ${err.message}` });
  }
};

export default handler;
