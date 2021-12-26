import axios from 'axios';
import { NextApiHandler } from 'next';
import cheerio from 'cheerio';

const handler: NextApiHandler = async (req, res) => {
  try {
    const response = await axios.get('https://csadvising.seas.harvard.edu/concentration/courses/tags/');
    const html = response.data;
    const $ = cheerio.load(html);
    const text = $('#tag-table > tbody > tr')
      .map(
        (_, el) => {
          const [courseNumber, title, tags] = $(el).children().map(
          // eslint-disable-next-line @typescript-eslint/no-shadow
            (_, td) => $(td).text().trim(),
          ).toArray();
          return { courseNumber, title, tags: tags.split(',').map((tag) => tag.trim()) };
        },
      )
      .toArray();
    res.json({ text });
  } catch (err) {
    const { message } = err as Error;
    res.status(500).json({ error: message });
  }
};

export default handler;
